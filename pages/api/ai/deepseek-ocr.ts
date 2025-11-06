import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

interface DeepSeekOCRResponse {
  success: boolean;
  text?: string;
  text_lines?: string[];
  model?: string;
  confidence?: number;
  method?: string;
  error?: string;
}

/**
 * API endpoint to extract text from images using DeepSeek-OCR
 * This endpoint calls a Python service that uses Hugging Face Transformers
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeepSeekOCRResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, imageUrl, prompt } = req.body;

    if (!imageData && !imageUrl) {
      return res.status(400).json({ 
        error: 'Either imageData (base64) or imageUrl must be provided' 
      });
    }

    // Path to Python service script
    const pythonScriptPath = join(process.cwd(), 'services', 'deepseek-ocr-service.py');
    
    // Check if Python script exists
    if (!existsSync(pythonScriptPath)) {
      return res.status(500).json({ 
        error: 'DeepSeek-OCR service not found. Please ensure services/deepseek-ocr-service.py exists.' 
      });
    }

    // Prepare JSON input for Python script (better for large images)
    const scriptInput = JSON.stringify({
      imageData,
      imageUrl,
      prompt: prompt || undefined,
    });

    // Call Python service with JSON input via stdin
    const result = await new Promise<DeepSeekOCRResponse>((resolve, reject) => {
      const pythonProcess = spawn('python3', [pythonScriptPath], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      // Write JSON input to stdin
      pythonProcess.stdin.write(scriptInput);
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log to console for debugging
        console.log('Python stderr:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Try to parse JSON from stdout
          const lines = stdout.trim().split('\n');
          let jsonLine = '';
          
          // Find the last JSON object in output
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const parsed = JSON.parse(lines[i]);
              jsonLine = lines[i];
              break;
            } catch {
              // Not JSON, continue
            }
          }
          
          if (!jsonLine) {
            // Try parsing entire stdout
            const parsed = JSON.parse(stdout);
            resolve(parsed);
          } else {
            resolve(JSON.parse(jsonLine));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${stdout}\nError: ${parseError}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}. Make sure Python 3 and required packages are installed.`));
      });

      // Set timeout (30 seconds for OCR processing)
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('OCR processing timeout after 30 seconds'));
      }, 30000);
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('DeepSeek-OCR API error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow large images
    },
  },
};

