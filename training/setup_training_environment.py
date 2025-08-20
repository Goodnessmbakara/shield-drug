#!/usr/bin/env python3
"""
Professional Drug Analysis Model Training Infrastructure
Sets up training environment for custom pharmaceutical AI models
"""

import os
import sys
import subprocess
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PharmaceuticalTrainingSetup:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.training_dir = self.project_root / "training"
        self.models_dir = self.project_root / "models"
        self.data_dir = self.project_root / "data"
        
    def setup_directories(self):
        """Create necessary directories for training"""
        directories = [
            self.training_dir,
            self.training_dir / "scripts",
            self.training_dir / "configs",
            self.training_dir / "notebooks",
            self.models_dir,
            self.models_dir / "drug_classifier",
            self.models_dir / "authenticity_verifier",
            self.models_dir / "pill_detector",
            self.models_dir / "text_detector",
            self.data_dir,
            self.data_dir / "raw",
            self.data_dir / "processed",
            self.data_dir / "annotations",
            self.data_dir / "pharmaceutical_images" / "authentic",
            self.data_dir / "pharmaceutical_images" / "counterfeit",
            self.data_dir / "pharmaceutical_images" / "validation",
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created directory: {directory}")
    
    def install_dependencies(self):
        """Install required packages for training"""
        requirements = [
            "tensorflow>=2.13.0",
            "tensorflow-hub>=0.14.0",
            "opencv-python>=4.8.0",
            "pillow>=10.0.0",
            "numpy>=1.24.0",
            "pandas>=2.0.0",
            "matplotlib>=3.7.0",
            "seaborn>=0.12.0",
            "scikit-learn>=1.3.0",
            "ultralytics>=8.0.0",  # For YOLOv8
            "albumentations>=1.3.0",  # Data augmentation
            "tensorboard>=2.13.0",
            "wandb>=0.15.0",  # Experiment tracking
            "huggingface-hub>=0.16.0",
            "transformers>=4.30.0",
            "datasets>=2.13.0",
            "tensorflowjs>=4.0.0",  # For model conversion
        ]
        
        logger.info("Installing training dependencies...")
        for requirement in requirements:
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", requirement], 
                             check=True, capture_output=True)
                logger.info(f"Installed: {requirement}")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to install {requirement}: {e}")
    
    def create_training_configs(self):
        """Create training configuration files"""
        
        # Drug Classifier Config
        drug_classifier_config = {
            "model_name": "drug_classifier",
            "architecture": "efficientnet_b3",
            "input_shape": [224, 224, 3],
            "num_classes": 50,  # Number of different drugs
            "batch_size": 32,
            "epochs": 100,
            "learning_rate": 0.001,
            "optimizer": "adam",
            "loss": "categorical_crossentropy",
            "metrics": ["accuracy", "top_k_categorical_accuracy"],
            "data_augmentation": {
                "rotation_range": 15,
                "width_shift_range": 0.1,
                "height_shift_range": 0.1,
                "brightness_range": [0.8, 1.2],
                "zoom_range": 0.1,
                "horizontal_flip": True
            },
            "callbacks": {
                "early_stopping": {"patience": 10},
                "reduce_lr": {"patience": 5, "factor": 0.5},
                "model_checkpoint": {"save_best_only": True}
            }
        }
        
        # Authenticity Verifier Config
        authenticity_config = {
            "model_name": "authenticity_verifier",
            "architecture": "resnet50_siamese",
            "input_shape": [256, 256, 3],
            "num_classes": 2,  # Authentic vs Counterfeit
            "batch_size": 16,
            "epochs": 75,
            "learning_rate": 0.0001,
            "optimizer": "adam",
            "loss": "binary_crossentropy",
            "metrics": ["accuracy", "precision", "recall"],
            "siamese_margin": 1.0,
            "data_augmentation": {
                "rotation_range": 10,
                "width_shift_range": 0.05,
                "height_shift_range": 0.05,
                "brightness_range": [0.9, 1.1],
                "zoom_range": 0.05
            }
        }
        
        # Pill Detection Config
        pill_detection_config = {
            "model_name": "pill_detector",
            "architecture": "yolov8n",
            "input_shape": [640, 640, 3],
            "classes": ["pill", "tablet", "capsule", "blister_pack"],
            "batch_size": 16,
            "epochs": 150,
            "learning_rate": 0.01,
            "optimizer": "SGD",
            "data_format": "yolo",
            "augmentation": {
                "hsv_h": 0.015,
                "hsv_s": 0.7,
                "hsv_v": 0.4,
                "degrees": 10.0,
                "translate": 0.1,
                "scale": 0.5,
                "shear": 2.0,
                "perspective": 0.0,
                "flipud": 0.0,
                "fliplr": 0.5,
                "mosaic": 1.0,
                "mixup": 0.1
            }
        }
        
        configs = [
            (drug_classifier_config, "drug_classifier_config.json"),
            (authenticity_config, "authenticity_config.json"),
            (pill_detection_config, "pill_detection_config.json")
        ]
        
        for config, filename in configs:
            config_path = self.training_dir / "configs" / filename
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            logger.info(f"Created config: {config_path}")

def main():
    """Main setup function"""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    logger.info("Setting up Pharmaceutical AI Training Environment...")
    
    setup = PharmaceuticalTrainingSetup(project_root)
    
    # Setup directories
    setup.setup_directories()
    
    # Install dependencies
    setup.install_dependencies()
    
    # Create training configs
    setup.create_training_configs()
    
    logger.info("✅ Training environment setup complete!")
    logger.info("Next steps:")
    logger.info("1. Add training data to data/pharmaceutical_images/")
    logger.info("2. Run training scripts in training/scripts/")
    logger.info("3. Monitor training with tensorboard --logdir models/")

if __name__ == "__main__":
    main()