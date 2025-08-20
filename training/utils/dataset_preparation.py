#!/usr/bin/env python3
"""
Dataset Preparation Utilities for Pharmaceutical AI Training
Tools for preparing, augmenting, and validating training datasets
"""

import os
import json
import shutil
import logging
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import cv2
from PIL import Image
import requests
from urllib.parse import urlparse
import hashlib
import random

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PharmaceuticalDatasetPreparer:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.data_dir = self.project_root / "data"
        self.raw_dir = self.data_dir / "raw"
        self.processed_dir = self.data_dir / "processed"
        self.annotations_dir = self.data_dir / "annotations"
        self.images_dir = self.data_dir / "pharmaceutical_images"
        
        # Create directories
        for directory in [self.raw_dir, self.processed_dir, self.annotations_dir, self.images_dir]:
            directory.mkdir(parents=True, exist_ok=True)
    
    def download_sample_pharmaceutical_dataset(self):
        """Download sample pharmaceutical images from open datasets"""
        logger.info("Downloading sample pharmaceutical datasets...")
        
        # Sample pharmaceutical image URLs (public domain/creative commons)
        sample_urls = [
            # FDA Orange Book images (public domain)
            "https://www.fda.gov/media/images/pill_samples/sample_01.jpg",
            "https://www.fda.gov/media/images/pill_samples/sample_02.jpg",
            # NIH Pill Images (public domain)
            "https://pillbox.nlm.nih.gov/assets/samples/aspirin_01.jpg",
            "https://pillbox.nlm.nih.gov/assets/samples/aspirin_02.jpg",
        ]
        
        # Note: These are placeholder URLs - in practice, you would use:
        # 1. NIH Pill Image Recognition Challenge dataset
        # 2. FDA's Orange Book API
        # 3. PharmaCorp datasets (with proper licensing)
        # 4. Academic pharmaceutical image datasets
        
        authentic_dir = self.images_dir / "authentic"
        authentic_dir.mkdir(parents=True, exist_ok=True)
        
        logger.warning("Sample URLs are placeholders. Please use legitimate pharmaceutical datasets:")
        logger.info("1. NIH Pill Image Recognition Challenge")
        logger.info("2. FDA Orange Book Database")
        logger.info("3. Academic pharmaceutical research datasets")
        logger.info("4. Licensed commercial pharmaceutical image databases")
        
        # Create placeholder structure
        drug_categories = [
            "paracetamol", "ibuprofen", "amoxicillin", "omeprazole", 
            "metformin", "lisinopril", "amlodipine", "simvastatin"
        ]
        
        for category in drug_categories:
            category_dir = authentic_dir / category
            category_dir.mkdir(exist_ok=True)
            
            # Create placeholder info file
            info_file = category_dir / "dataset_info.json"
            info = {
                "drug_name": category,
                "description": f"Placeholder directory for {category} images",
                "expected_images": 100,
                "current_images": 0,
                "sources": ["FDA", "NIH", "Academic"],
                "notes": "Add real pharmaceutical images here"
            }
            
            with open(info_file, 'w') as f:
                json.dump(info, f, indent=2)
        
        # Create counterfeit structure
        counterfeit_dir = self.images_dir / "counterfeit"
        counterfeit_dir.mkdir(parents=True, exist_ok=True)
        
        for category in drug_categories:
            category_dir = counterfeit_dir / category
            category_dir.mkdir(exist_ok=True)
            
            info_file = category_dir / "dataset_info.json"
            info = {
                "drug_name": category,
                "type": "counterfeit",
                "description": f"Counterfeit {category} samples for training",
                "expected_images": 50,
                "current_images": 0,
                "sources": ["Seized samples", "Regulatory databases"],
                "notes": "Add counterfeit samples here (with proper authorization)"
            }
            
            with open(info_file, 'w') as f:
                json.dump(info, f, indent=2)
    
    def validate_dataset_structure(self) -> Dict:
        """Validate the dataset structure and return statistics"""
        logger.info("Validating dataset structure...")
        
        stats = {
            "authentic": {},
            "counterfeit": {},
            "total_images": 0,
            "issues": []
        }
        
        for dataset_type in ["authentic", "counterfeit"]:
            type_dir = self.images_dir / dataset_type
            stats[dataset_type]["total"] = 0
            stats[dataset_type]["categories"] = {}
            
            if not type_dir.exists():
                stats["issues"].append(f"Missing {dataset_type} directory")
                continue
            
            for category_dir in type_dir.glob("*"):
                if not category_dir.is_dir():
                    continue
                
                category_name = category_dir.name
                image_files = []
                
                # Count images
                for ext in ["*.jpg", "*.jpeg", "*.png", "*.bmp"]:
                    image_files.extend(list(category_dir.glob(ext)))
                
                count = len(image_files)
                stats[dataset_type]["categories"][category_name] = count
                stats[dataset_type]["total"] += count
                
                # Check for minimum images
                if count < 10:
                    stats["issues"].append(f"Low image count for {dataset_type}/{category_name}: {count}")
        
        stats["total_images"] = stats["authentic"]["total"] + stats["counterfeit"]["total"]
        
        # Log statistics
        logger.info(f"Dataset Statistics:")
        logger.info(f"  Authentic images: {stats['authentic']['total']}")
        logger.info(f"  Counterfeit images: {stats['counterfeit']['total']}")
        logger.info(f"  Total images: {stats['total_images']}")
        
        if stats["issues"]:
            logger.warning(f"Found {len(stats['issues'])} issues:")
            for issue in stats["issues"]:
                logger.warning(f"  - {issue}")
        
        # Save validation report
        report_path = self.data_dir / "validation_report.json"
        with open(report_path, 'w') as f:
            json.dump(stats, f, indent=2)
        
        return stats
    
    def create_yolo_annotations(self, image_dir: Path, output_dir: Path):
        """Create YOLO format annotations for pill detection"""
        logger.info(f"Creating YOLO annotations for {image_dir}")
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # In a real scenario, this would use actual annotation data
        # For now, create template annotations
        
        annotations = []
        
        for image_file in image_dir.glob("**/*.jpg"):
            relative_path = image_file.relative_to(image_dir)
            
            # Load image to get dimensions
            try:
                img = cv2.imread(str(image_file))
                if img is None:
                    continue
                    
                height, width = img.shape[:2]
                
                # Create sample annotation (center pill detection)
                # Format: class_id center_x center_y width height (normalized)
                annotation = {
                    "image_path": str(relative_path),
                    "image_width": width,
                    "image_height": height,
                    "annotations": [
                        {
                            "class_id": 0,  # pill class
                            "center_x": 0.5,  # normalized center x
                            "center_y": 0.5,  # normalized center y
                            "width": 0.3,     # normalized width
                            "height": 0.4     # normalized height
                        }
                    ]
                }
                
                annotations.append(annotation)
                
                # Create YOLO format annotation file
                annotation_file = output_dir / f"{image_file.stem}.txt"
                with open(annotation_file, 'w') as f:
                    for ann in annotation["annotations"]:
                        f.write(f"{ann['class_id']} {ann['center_x']} {ann['center_y']} {ann['width']} {ann['height']}\\n")
                        
            except Exception as e:
                logger.warning(f"Failed to process {image_file}: {e}")
        
        # Save annotation summary
        summary_path = output_dir / "annotations_summary.json"
        with open(summary_path, 'w') as f:
            json.dump({
                "total_images": len(annotations),
                "classes": ["pill", "tablet", "capsule", "blister_pack"],
                "format": "YOLO",
                "notes": "Template annotations - replace with real annotations"
            }, f, indent=2)
        
        logger.info(f"Created {len(annotations)} YOLO annotations")
    
    def split_dataset(self, train_ratio: float = 0.7, val_ratio: float = 0.2, test_ratio: float = 0.1):
        """Split dataset into train/validation/test sets"""
        if abs(train_ratio + val_ratio + test_ratio - 1.0) > 1e-6:
            raise ValueError("Ratios must sum to 1.0")
        
        logger.info(f"Splitting dataset: train={train_ratio}, val={val_ratio}, test={test_ratio}")
        
        # Create split directories
        splits = ["train", "val", "test"]
        for split in splits:
            for dataset_type in ["authentic", "counterfeit"]:
                split_dir = self.processed_dir / split / dataset_type
                split_dir.mkdir(parents=True, exist_ok=True)
        
        # Process each category
        for dataset_type in ["authentic", "counterfeit"]:
            type_dir = self.images_dir / dataset_type
            
            if not type_dir.exists():
                continue
            
            for category_dir in type_dir.glob("*"):
                if not category_dir.is_dir():
                    continue
                
                category_name = category_dir.name
                
                # Get all images
                image_files = []
                for ext in ["*.jpg", "*.jpeg", "*.png", "*.bmp"]:
                    image_files.extend(list(category_dir.glob(ext)))
                
                if not image_files:
                    continue
                
                # Shuffle for random split
                random.shuffle(image_files)
                
                # Calculate split indices
                n_total = len(image_files)
                n_train = int(n_total * train_ratio)
                n_val = int(n_total * val_ratio)
                
                train_files = image_files[:n_train]
                val_files = image_files[n_train:n_train + n_val]
                test_files = image_files[n_train + n_val:]
                
                # Copy files to appropriate directories
                for split_name, file_list in [("train", train_files), ("val", val_files), ("test", test_files)]:
                    target_dir = self.processed_dir / split_name / dataset_type / category_name
                    target_dir.mkdir(parents=True, exist_ok=True)
                    
                    for img_file in file_list:
                        target_path = target_dir / img_file.name
                        shutil.copy2(img_file, target_path)
                
                logger.info(f"Split {category_name} ({dataset_type}): {len(train_files)} train, {len(val_files)} val, {len(test_files)} test")
        
        # Create split summary
        split_summary = {
            "split_ratios": {
                "train": train_ratio,
                "validation": val_ratio,
                "test": test_ratio
            },
            "splits": {}
        }
        
        for split in splits:
            split_summary["splits"][split] = {}
            for dataset_type in ["authentic", "counterfeit"]:
                split_dir = self.processed_dir / split / dataset_type
                if split_dir.exists():
                    image_count = len(list(split_dir.glob("**/*.jpg"))) + len(list(split_dir.glob("**/*.png")))
                    split_summary["splits"][split][dataset_type] = image_count
        
        summary_path = self.processed_dir / "dataset_splits.json"
        with open(summary_path, 'w') as f:
            json.dump(split_summary, f, indent=2)
        
        logger.info("Dataset splitting completed")
        return split_summary
    
    def generate_dataset_report(self) -> Dict:
        """Generate comprehensive dataset report"""
        report = {
            "dataset_info": {
                "project_root": str(self.project_root),
                "data_directory": str(self.data_dir),
                "created_at": pd.Timestamp.now().isoformat()
            },
            "structure_validation": self.validate_dataset_structure(),
            "recommendations": []
        }
        
        # Add recommendations based on validation
        stats = report["structure_validation"]
        
        if stats["total_images"] < 1000:
            report["recommendations"].append(
                "Consider adding more training images. Minimum recommended: 1000+ images per class"
            )
        
        if len(stats["issues"]) > 0:
            report["recommendations"].append(
                "Address dataset issues identified in validation"
            )
        
        if stats["authentic"]["total"] < 100:
            report["recommendations"].append(
                "Add more authentic pharmaceutical images for better classification"
            )
        
        if stats["counterfeit"]["total"] < 50:
            report["recommendations"].append(
                "Add counterfeit samples for authenticity verification training"
            )
        
        # Save report
        report_path = self.data_dir / f"dataset_report_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Dataset report saved to: {report_path}")
        return report

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Prepare Pharmaceutical Dataset')
    parser.add_argument('--project-root', default=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                       help='Project root directory')
    parser.add_argument('--download-samples', action='store_true',
                       help='Download sample dataset structure')
    parser.add_argument('--create-annotations', action='store_true',
                       help='Create YOLO annotations')
    parser.add_argument('--split-dataset', action='store_true',
                       help='Split dataset into train/val/test')
    parser.add_argument('--validate-only', action='store_true',
                       help='Only validate dataset structure')
    
    args = parser.parse_args()
    
    preparer = PharmaceuticalDatasetPreparer(args.project_root)
    
    if args.download_samples:
        preparer.download_sample_pharmaceutical_dataset()
    
    if args.create_annotations:
        authentic_dir = preparer.images_dir / "authentic"
        annotations_dir = preparer.annotations_dir / "yolo"
        preparer.create_yolo_annotations(authentic_dir, annotations_dir)
    
    if args.split_dataset:
        preparer.split_dataset()
    
    # Always generate report
    report = preparer.generate_dataset_report()
    
    print("\\n" + "="*60)
    print("PHARMACEUTICAL DATASET PREPARATION SUMMARY")
    print("="*60)
    print(f"Total Images: {report['structure_validation']['total_images']}")
    print(f"Authentic: {report['structure_validation']['authentic']['total']}")
    print(f"Counterfeit: {report['structure_validation']['counterfeit']['total']}")
    
    if report["recommendations"]:
        print("\\nRecommendations:")
        for i, rec in enumerate(report["recommendations"], 1):
            print(f"{i}. {rec}")

if __name__ == "__main__":
    main()