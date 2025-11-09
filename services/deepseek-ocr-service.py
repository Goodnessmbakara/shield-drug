#!/usr/bin/env python3
"""
DeepSeek-OCR Service
A Python service that uses Hugging Face Transformers to run DeepSeek-OCR
for pharmaceutical text extraction from images.
"""

import sys
import json
import base64
import io
from pathlib import Path
from typing import Dict, List, Optional, Union

try:
    from transformers import pipeline
    from PIL import Image
except ImportError as e:
    print(json.dumps({
        "error": f"Missing dependencies: {str(e)}",
        "message": "Please install: pip install transformers torch pillow"
    }), file=sys.stderr)
    sys.exit(1)

# Global pipeline instance
_pipeline = None

def initialize_pipeline():
    """Initialize the DeepSeek-OCR pipeline."""
    global _pipeline
    if _pipeline is None:
        try:
            print("Loading DeepSeek-OCR model...", file=sys.stderr)
            _pipeline = pipeline(
                "image-text-to-text",
                model="deepseek-ai/DeepSeek-OCR",
                trust_remote_code=True
            )
            print("DeepSeek-OCR model loaded successfully", file=sys.stderr)
        except Exception as e:
            print(f"Failed to load model: {str(e)}", file=sys.stderr)
            raise
    return _pipeline

def decode_image(image_data: str) -> Image.Image:
    """Decode base64 image data or file path to PIL Image."""
    try:
        # Handle base64 data URL
        if image_data.startswith('data:image'):
            # Extract base64 part
            header, encoded = image_data.split(',', 1)
            image_bytes = base64.b64decode(encoded)
            return Image.open(io.BytesIO(image_bytes))
        # Handle base64 string
        elif image_data.startswith('/9j/') or image_data.startswith('iVBOR'):
            # Try base64 decode
            image_bytes = base64.b64decode(image_data)
            return Image.open(io.BytesIO(image_bytes))
        # Handle file path
        else:
            return Image.open(image_data)
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")

def extract_text_from_image(
    image_data: Union[str, bytes],
    prompt: Optional[str] = None,
    image_url: Optional[str] = None
) -> Dict:
    """
    Extract text from an image using DeepSeek-OCR.
    
    Args:
        image_data: Base64-encoded image, data URL, or file path
        prompt: Optional prompt for OCR (defaults to pharmaceutical-focused prompt)
        image_url: Optional image URL (alternative to image_data)
    
    Returns:
        Dictionary with extracted text and metadata
    """
    try:
        pipe = initialize_pipeline()
        
        # Default prompt for pharmaceutical text extraction
        if prompt is None:
            prompt = "Extract all text from this pharmaceutical image, including drug names, batch numbers, expiry dates, and manufacturer information. List all visible text clearly."
        
        # Prepare messages for the pipeline
        messages = [{
            "role": "user",
            "content": []
        }]
        
        # Add image - prefer image_data over image_url
        if image_data:
            if isinstance(image_data, bytes):
                # Convert bytes to PIL Image
                image = Image.open(io.BytesIO(image_data))
            else:
                # Decode base64 or file path
                image = decode_image(image_data)
            
            # Convert PIL Image to base64 for the pipeline
            # Note: The pipeline expects either URL or base64
            # For local images, we'll use base64
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            image_url_data = f"data:image/png;base64,{image_base64}"
            
            messages[0]["content"].append({
                "type": "image",
                "url": image_url_data
            })
        elif image_url:
            messages[0]["content"].append({
                "type": "image",
                "url": image_url
            })
        else:
            raise ValueError("Either image_data or image_url must be provided")
        
        # Add text prompt
        messages[0]["content"].append({
            "type": "text",
            "text": prompt
        })
        
        # Run the pipeline
        result = pipe(text=messages)
        
        # Extract text from result
        # The result structure may vary, but typically contains text in the response
        extracted_text = ""
        if isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], dict):
                # Try common response formats
                extracted_text = result[0].get('generated_text', '') or result[0].get('text', '') or str(result[0])
            else:
                extracted_text = str(result[0])
        elif isinstance(result, dict):
            extracted_text = result.get('generated_text', '') or result.get('text', '') or str(result)
        else:
            extracted_text = str(result)
        
        # Split text into lines for easier processing
        text_lines = [line.strip() for line in extracted_text.split('\n') if line.strip()]
        
        return {
            "success": True,
            "text": extracted_text,
            "text_lines": text_lines,
            "model": "deepseek-ai/DeepSeek-OCR",
            "confidence": 1.0,  # DeepSeek-OCR doesn't provide confidence scores
            "method": "deepseek-ocr"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "text": "",
            "text_lines": [],
            "model": "deepseek-ai/DeepSeek-OCR",
            "method": "deepseek-ocr"
        }

def main():
    """Main entry point for command-line usage."""
    # Try to read JSON from stdin first (for API calls)
    try:
        import select
        if select.select([sys.stdin], [], [], 0)[0]:
            stdin_data = sys.stdin.read()
            if stdin_data.strip():
                try:
                    input_data = json.loads(stdin_data)
                    image_data = input_data.get('imageData') or input_data.get('imageUrl')
                    prompt = input_data.get('prompt')
                    result = extract_text_from_image(image_data, prompt)
                    print(json.dumps(result, indent=2))
                    return
                except json.JSONDecodeError:
                    pass
    except (ImportError, OSError):
        # select not available on Windows, or stdin not available
        pass
    
    # Fallback to command-line arguments
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python deepseek-ocr-service.py <image_data_or_path> [prompt] or provide JSON via stdin"
        }), file=sys.stderr)
        sys.exit(1)
    
    image_data = sys.argv[1]
    prompt = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = extract_text_from_image(image_data, prompt)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()

