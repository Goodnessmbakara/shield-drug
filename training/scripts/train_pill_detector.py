#!/usr/bin/env python3
"""
Pill Detector Training Script
Trains a YOLOv8 model for pharmaceutical pill/tablet detection and segmentation
"""

import os
import json
import logging
import yaml
from pathlib import Path
from ultralytics import YOLO
import tensorflowjs as tfjs
import tensorflow as tf

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PillDetectorTrainer:
    def __init__(self, config_path: str, data_dir: str, output_dir: str):
        self.config_path = Path(config_path)
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load configuration
        with open(self.config_path, 'r') as f:
            self.config = json.load(f)
        
        logger.info(f"Loaded config: {self.config['model_name']}")
    
    def create_yolo_dataset_config(self):
        """Create YOLO dataset configuration file"""
        dataset_config = {
            'path': str(self.data_dir.absolute()),
            'train': 'images/train',
            'val': 'images/val',
            'test': 'images/test',
            'nc': len(self.config['classes']),  # number of classes
            'names': {i: name for i, name in enumerate(self.config['classes'])}
        }
        
        # Save dataset config
        dataset_yaml_path = self.output_dir / 'dataset.yaml'
        with open(dataset_yaml_path, 'w') as f:
            yaml.dump(dataset_config, f, default_flow_style=False)
        
        logger.info(f"Created YOLO dataset config: {dataset_yaml_path}")
        return dataset_yaml_path
    
    def setup_yolo_directory_structure(self):
        """Setup YOLO training directory structure"""
        directories = [
            self.data_dir / 'images' / 'train',
            self.data_dir / 'images' / 'val', 
            self.data_dir / 'images' / 'test',
            self.data_dir / 'labels' / 'train',
            self.data_dir / 'labels' / 'val',
            self.data_dir / 'labels' / 'test'
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created directory: {directory}")
    
    def convert_annotations_to_yolo_format(self):
        """Convert COCO/other annotations to YOLO format"""
        # This would typically convert from COCO JSON or other formats to YOLO txt format
        # For now, we'll create a placeholder implementation
        
        annotations_dir = self.data_dir / 'annotations'
        if not annotations_dir.exists():
            logger.warning("No annotations directory found. Please add annotations in YOLO format.")
            return
        
        # Example YOLO annotation format:
        # Each line: class_id center_x center_y width height (normalized 0-1)
        # 0 0.5 0.5 0.3 0.4  # class 0 (pill) at center with 30% width, 40% height
        
        logger.info("Annotation conversion would happen here")
        logger.info("YOLO format: class_id center_x center_y width height")
    
    def train_yolo_model(self, dataset_yaml_path):
        """Train YOLOv8 model"""
        logger.info("Starting YOLOv8 pill detection training...")
        
        # Initialize YOLOv8 model
        model_size = self.config.get('architecture', 'yolov8n')  # n, s, m, l, x
        model = YOLO(f'{model_size}.pt')  # Load pretrained model
        
        # Training parameters
        train_params = {
            'data': str(dataset_yaml_path),
            'epochs': self.config['epochs'],
            'imgsz': self.config['input_shape'][0],  # Image size
            'batch': self.config['batch_size'],
            'lr0': self.config['learning_rate'],
            'optimizer': self.config['optimizer'],
            'project': str(self.output_dir),
            'name': 'pill_detection_training',
            'save': True,
            'save_period': 10,  # Save every 10 epochs
            'cache': True,  # Cache images for faster training
            'device': 0,  # GPU device (0 for first GPU, 'cpu' for CPU)
            'workers': 8,  # Number of worker threads
            'patience': 50,  # Early stopping patience
            'amp': True,  # Automatic Mixed Precision
        }
        
        # Add augmentation parameters
        aug_config = self.config.get('augmentation', {})
        train_params.update(aug_config)
        
        # Train the model
        results = model.train(**train_params)
        
        # Export trained model
        model_path = self.output_dir / 'pill_detection_training' / 'weights' / 'best.pt'
        
        # Export to different formats
        if model_path.exists():
            trained_model = YOLO(str(model_path))
            
            # Export to ONNX
            trained_model.export(format='onnx', optimize=True)
            
            # Export to TensorFlow SavedModel
            trained_model.export(format='saved_model')
            
            # Export to TensorFlow Lite
            trained_model.export(format='tflite', int8=True)
            
            logger.info("Model exported to multiple formats")
        
        logger.info("✅ YOLOv8 pill detection training completed!")
        return results
    
    def convert_to_tensorflowjs(self):
        """Convert trained model to TensorFlow.js format"""
        try:
            # Path to the exported SavedModel
            saved_model_path = self.output_dir / 'pill_detection_training' / 'weights' / 'best_saved_model'
            tfjs_output_path = self.output_dir / 'tfjs_model'
            
            if saved_model_path.exists():
                # Convert SavedModel to TensorFlow.js
                tfjs.converters.convert_tf_saved_model(
                    str(saved_model_path),
                    str(tfjs_output_path),
                    quantization_bytes=2,  # Quantize to reduce model size
                    skip_op_check=True
                )
                
                logger.info(f"TensorFlow.js model saved to: {tfjs_output_path}")
            else:
                logger.warning("SavedModel not found, skipping TensorFlow.js conversion")
                
        except Exception as e:
            logger.error(f"TensorFlow.js conversion failed: {e}")
    
    def create_inference_script(self):
        """Create inference script for the trained model"""
        inference_script = f'''#!/usr/bin/env python3
"""
Pill Detection Inference Script
"""
from ultralytics import YOLO
import cv2
import numpy as np

class PillDetector:
    def __init__(self, model_path):
        self.model = YOLO(model_path)
    
    def detect_pills(self, image_path, conf_threshold=0.5):
        """Detect pills in an image"""
        results = self.model(image_path, conf=conf_threshold)
        
        detections = []
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = self.model.names[class_id]
                    
                    detections.append({{
                        'bbox': [float(x1), float(y1), float(x2), float(y2)],
                        'confidence': float(confidence),
                        'class': class_name,
                        'class_id': class_id
                    }})
        
        return detections

# Usage example:
if __name__ == "__main__":
    detector = PillDetector("{self.output_dir}/pill_detection_training/weights/best.pt")
    results = detector.detect_pills("path/to/image.jpg")
    print(results)
'''
        
        script_path = self.output_dir / 'inference_script.py'
        with open(script_path, 'w') as f:
            f.write(inference_script)
        
        logger.info(f"Created inference script: {script_path}")
    
    def train(self):
        """Main training function"""
        logger.info("Setting up pill detection training...")
        
        # Setup directory structure
        self.setup_yolo_directory_structure()
        
        # Convert annotations
        self.convert_annotations_to_yolo_format()
        
        # Create dataset config
        dataset_yaml_path = self.create_yolo_dataset_config()
        
        # Train model
        results = self.train_yolo_model(dataset_yaml_path)
        
        # Convert to TensorFlow.js
        self.convert_to_tensorflowjs()
        
        # Create inference script
        self.create_inference_script()
        
        # Save training configuration
        with open(self.output_dir / 'training_config.json', 'w') as f:
            json.dump(self.config, f, indent=2)
        
        logger.info(f"✅ Pill detector training completed!")
        logger.info(f"Results saved to: {self.output_dir}")
        
        return results

def main():
    """Main training function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Pill Detector')
    parser.add_argument('--config', required=True, help='Config file path')
    parser.add_argument('--data', required=True, help='Data directory path')
    parser.add_argument('--output', required=True, help='Output directory path')
    
    args = parser.parse_args()
    
    trainer = PillDetectorTrainer(args.config, args.data, args.output)
    trainer.train()

if __name__ == "__main__":
    main()