import dbConnect from "@/lib/database";
import DrugAnalysis from "@/lib/models/DrugAnalysis";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  if (req.method === "GET") {
    // Get analysis history for a user
    const { userEmail } = req.query;
    
    if (!userEmail) {
      return res.status(400).json({ error: "Missing userEmail parameter" });
    }

    try {
      const analyses = await DrugAnalysis.find({ userEmail })
        .sort({ createdAt: -1 })
        .limit(50);
      
      return res.status(200).json(analyses);
    } catch (error) {
      console.error("Failed to fetch analysis history:", error);
      return res.status(500).json({ error: "Failed to fetch analysis history" });
    }
  }

  if (req.method === "POST") {
    // Save a new drug analysis
    const { 
      userEmail, 
      drugName, 
      strength, 
      confidence, 
      status, 
      issues, 
      extractedText, 
      visualFeatures,
      isDrugImage,
      imageClassification,
      processingTime,
      modelStatus,
      imageUrl,
      method
    } = req.body;

    if (!userEmail || !drugName) {
      return res.status(400).json({ error: "Missing required fields: userEmail and drugName" });
    }

    try {
      const analysis = await DrugAnalysis.create({
        userEmail,
        drugName,
        strength: strength || 'Unknown',
        confidence: confidence || 0,
        status: status || 'suspicious',
        issues: issues || [],
        extractedText: extractedText || [],
        visualFeatures: visualFeatures || {
          color: 'unknown',
          shape: 'unknown',
          markings: [],
          objectDetections: []
        },
        isDrugImage: isDrugImage !== undefined ? isDrugImage : true,
        imageClassification: imageClassification || {
          isPharmaceutical: false,
          detectedObjects: [],
          confidence: 0,
          detectionMethod: 'unknown',
          boundingBoxCount: 0
        },
        processingTime,
        modelStatus,
        imageUrl,
        method: method || 'Photo Analysis'
      });

      return res.status(201).json({ 
        success: true, 
        analysis: {
          id: analysis._id.toString(),
          ...analysis.toObject()
        }
      });
    } catch (error) {
      console.error("Failed to save analysis:", error);
      return res.status(500).json({ error: "Failed to save analysis" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
