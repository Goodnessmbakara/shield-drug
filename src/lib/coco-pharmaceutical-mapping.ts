// COCO-SSD object detection mapping to pharmaceutical relevance
// Maps COCO class names to pharmaceutical relevance scores and categories

import { ObjectDetection } from './types';

export type { ObjectDetection };

// COCO class mapping to pharmaceutical relevance - deduplicated and pruned
export const PHARMACEUTICAL_COCO_CLASSES: { [key: string]: number } = {
  // High relevance - medicine containers and medical tools
  'bottle': 1.0, // Medicine bottles
  'cup': 0.9, // Medicine cups
  'bowl': 0.8, // Medicine containers
  'refrigerator': 0.8, // Medicine storage
  'toothbrush': 0.6, // Medical/hygiene item
  'scissors': 0.4, // Medical tool
  
  // Medium relevance - potential medical context
  'remote': 0.6, // Could be medical device
  'cell phone': 0.5, // Could have medical apps/labels
  'laptop': 0.4, // Could display medical information
  'book': 0.4, // Could be medical literature
  'sink': 0.4, // Could be in medical setting
  'vase': 0.7, // Could contain medicine
  
  // Low relevance - minimal medical context
  'mouse': 0.3, // Low relevance
  'keyboard': 0.3, // Low relevance
  'clock': 0.3, // Low relevance
  'bed': 0.3, // Could be hospital bed
  'backpack': 0.3, // Could contain medicine
  'handbag': 0.3, // Could contain medicine
  'suitcase': 0.3, // Could contain medicine
  'wine glass': 0.2, // Could be medicine glass
  'tv': 0.2, // Very low relevance
  'chair': 0.2, // Very low relevance
  'dining table': 0.2, // Very low relevance
  'lamp': 0.2, // Very low relevance
  'bench': 0.1, // Minimal relevance
  'microwave': 0.3, // Low relevance
  'oven': 0.2, // Very low relevance
  'toaster': 0.1, // Minimal relevance
  'toilet': 0.1, // Minimal relevance
  'door': 0.1, // Minimal relevance
  'window': 0.1, // Minimal relevance
  'plant': 0.1, // Minimal relevance
  'potted plant': 0.1, // Minimal relevance
  'umbrella': 0.1, // Minimal relevance
  'fork': 0.1, // Minimal relevance
  'knife': 0.1, // Minimal relevance
  'spoon': 0.1, // Minimal relevance
  'hair drier': 0.1, // Minimal relevance
  'couch': 0.1, // Minimal relevance
  
  // Negative relevance - clearly non-pharmaceutical
  'person': 0.0, // Not a pharmaceutical object
  'bicycle': 0.0, 'car': 0.0, 'motorcycle': 0.0, 'airplane': 0.0, 'bus': 0.0,
  'train': 0.0, 'truck': 0.0, 'boat': 0.0, 'traffic light': 0.0, 'fire hydrant': 0.0,
  'stop sign': 0.0, 'parking meter': 0.0, 'bird': 0.0, 'cat': 0.0, 'dog': 0.0,
  'horse': 0.0, 'sheep': 0.0, 'cow': 0.0, 'elephant': 0.0, 'bear': 0.0,
  'zebra': 0.0, 'giraffe': 0.0, 'tie': 0.0, 'frisbee': 0.0, 'skis': 0.0,
  'snowboard': 0.0, 'sports ball': 0.0, 'kite': 0.0, 'baseball bat': 0.0,
  'baseball glove': 0.0, 'skateboard': 0.0, 'surfboard': 0.0, 'tennis racket': 0.0,
  'banana': 0.0, 'apple': 0.0, 'sandwich': 0.0, 'orange': 0.0, 'broccoli': 0.0,
  'carrot': 0.0, 'hot dog': 0.0, 'pizza': 0.0, 'donut': 0.0, 'cake': 0.0,
  'teddy bear': 0.0
};

// Default configuration constants
export const DEFAULT_MIN_DETECTION_SCORE = 0.4;
export const MAX_RELEVANT_DETECTIONS = 10;

// Pharmaceutical keywords for additional classification
export const PHARMACEUTICAL_KEYWORDS = [
  'medicine', 'pill', 'tablet', 'capsule', 'bottle', 'syringe', 'inhaler',
  'medicine', 'drug', 'pharmaceutical', 'prescription', 'dosage', 'mg',
  'ml', 'cc', 'injection', 'oral', 'topical', 'cream', 'ointment'
];

/**
 * Get pharmaceutical relevance score for a COCO class
 */
export function getPharmaceuticalRelevanceScore(cocoClass: string): number {
  return PHARMACEUTICAL_COCO_CLASSES[cocoClass] || 0.0;
}

/**
 * Check if a COCO class is pharmaceutical relevant
 */
export function isPharmaceuticalRelevant(cocoClass: string): boolean {
  return getPharmaceuticalRelevanceScore(cocoClass) > 0.3;
}

/**
 * Classify detected objects into pharmaceutical and non-pharmaceutical categories
 */
export function classifyDetectedObjects(detections: ObjectDetection[]): {
  pharmaceutical: ObjectDetection[];
  nonPharmaceutical: ObjectDetection[];
} {
  const pharmaceutical: ObjectDetection[] = [];
  const nonPharmaceutical: ObjectDetection[] = [];

  for (const detection of detections) {
    if (detection.isPharmaceuticalRelevant) {
      pharmaceutical.push(detection);
    } else {
      nonPharmaceutical.push(detection);
    }
  }

  return { pharmaceutical, nonPharmaceutical };
}

/**
 * Rank detections by pharmaceutical relevance (highest first)
 */
export function rankDetectionsByRelevance(detections: ObjectDetection[]): ObjectDetection[] {
  return detections.sort((a, b) => {
    const aScore = getPharmaceuticalRelevanceScore(a.class);
    const bScore = getPharmaceuticalRelevanceScore(b.class);
    if (bScore !== aScore) return bScore - aScore;
    return b.confidence - a.confidence;
  });
}

/**
 * Filter out low-confidence detections
 */
export function filterLowConfidenceDetections(
  detections: ObjectDetection[], 
  minScore: number = DEFAULT_MIN_DETECTION_SCORE
): ObjectDetection[] {
  return detections.filter(detection => detection.confidence >= minScore);
}

/**
 * Process raw COCO-SSD detections and convert to pharmaceutical-relevant format
 */
export function processCocoDetections(rawDetections: any[]): ObjectDetection[] {
  return rawDetections.map(detection => ({
    class: detection.class,
    confidence: detection.score,
    bbox: detection.bbox as [number, number, number, number],
    isPharmaceuticalRelevant: isPharmaceuticalRelevant(detection.class)
  }));
}

/**
 * Get top pharmaceutical-relevant detections
 */
export function getTopPharmaceuticalDetections(
  detections: ObjectDetection[], 
  maxCount: number = MAX_RELEVANT_DETECTIONS
): ObjectDetection[] {
  const relevant = detections.filter(d => d.isPharmaceuticalRelevant);
  const ranked = rankDetectionsByRelevance(relevant);
  return ranked.slice(0, maxCount);
}
