#!/usr/bin/env python3
"""
Professional Drug Analysis Model Training Orchestrator
Coordinates training of all pharmaceutical AI models
"""

import os
import sys
import json
import logging
import argparse
import subprocess
from pathlib import Path
from datetime import datetime
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ModelTrainingOrchestrator:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.training_dir = self.project_root / "training"
        self.scripts_dir = self.training_dir / "scripts"
        self.configs_dir = self.training_dir / "configs"
        self.models_dir = self.project_root / "models"
        self.data_dir = self.project_root / "data"
        
        # Training status tracking
        self.training_status = {
            'drug_classifier': {'status': 'pending', 'start_time': None, 'end_time': None, 'error': None},
            'authenticity_verifier': {'status': 'pending', 'start_time': None, 'end_time': None, 'error': None},
            'pill_detector': {'status': 'pending', 'start_time': None, 'end_time': None, 'error': None}
        }
        
    def check_prerequisites(self):
        """Check if all prerequisites are met for training"""
        logger.info("Checking training prerequisites...")
        
        # Check if required directories exist
        required_dirs = [self.scripts_dir, self.configs_dir, self.data_dir]
        for directory in required_dirs:
            if not directory.exists():
                logger.error(f"Required directory missing: {directory}")
                return False
        
        # Check if training scripts exist
        required_scripts = [
            'train_drug_classifier.py',
            'train_authenticity_verifier.py', 
            'train_pill_detector.py'
        ]
        
        for script in required_scripts:
            script_path = self.scripts_dir / script
            if not script_path.exists():
                logger.error(f"Required training script missing: {script_path}")
                return False
        
        # Check if config files exist
        required_configs = [
            'drug_classifier_config.json',
            'authenticity_config.json',
            'pill_detection_config.json'
        ]
        
        for config in required_configs:
            config_path = self.configs_dir / config
            if not config_path.exists():
                logger.error(f"Required config file missing: {config_path}")
                return False
        
        # Check if data directories exist
        data_dirs = [
            self.data_dir / 'pharmaceutical_images' / 'authentic',
            self.data_dir / 'pharmaceutical_images' / 'counterfeit'
        ]
        
        for data_dir in data_dirs:
            if not data_dir.exists():
                logger.warning(f"Data directory missing: {data_dir}")
                logger.warning("Training may fail without proper data setup")
        
        logger.info("✅ Prerequisites check completed")
        return True
    
    def install_requirements(self):
        """Install training requirements"""
        requirements_path = self.training_dir / "requirements.txt"
        
        if not requirements_path.exists():
            logger.error("requirements.txt not found")
            return False
        
        try:
            logger.info("Installing training requirements...")
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", str(requirements_path)
            ], check=True, capture_output=True, text=True)
            logger.info("✅ Requirements installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install requirements: {e}")
            return False
    
    def train_model(self, model_name: str, script_name: str, config_name: str):
        """Train a specific model"""
        logger.info(f"Starting training for {model_name}...")
        
        self.training_status[model_name]['status'] = 'running'
        self.training_status[model_name]['start_time'] = datetime.now()
        
        try:
            script_path = self.scripts_dir / script_name
            config_path = self.configs_dir / config_name
            output_dir = self.models_dir / model_name
            
            # Ensure output directory exists
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Run training script
            cmd = [
                sys.executable, str(script_path),
                '--config', str(config_path),
                '--data', str(self.data_dir),
                '--output', str(output_dir)
            ]
            
            logger.info(f"Executing: {' '.join(cmd)}")
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Stream output in real-time
            log_file_path = output_dir / f"{model_name}_training.log"
            with open(log_file_path, 'w') as log_file:
                for line in iter(process.stdout.readline, ''):
                    if line:
                        line = line.strip()
                        logger.info(f"[{model_name}] {line}")
                        log_file.write(f"{datetime.now().isoformat()} - {line}\\n")
                        log_file.flush()
            
            process.wait()
            
            if process.returncode == 0:
                self.training_status[model_name]['status'] = 'completed'
                logger.info(f"✅ {model_name} training completed successfully")
            else:
                self.training_status[model_name]['status'] = 'failed'
                self.training_status[model_name]['error'] = f"Process exited with code {process.returncode}"
                logger.error(f"❌ {model_name} training failed with exit code {process.returncode}")
                return False
                
        except Exception as e:
            self.training_status[model_name]['status'] = 'failed'
            self.training_status[model_name]['error'] = str(e)
            logger.error(f"❌ {model_name} training failed: {e}")
            return False
        finally:
            self.training_status[model_name]['end_time'] = datetime.now()
        
        return True
    
    def train_all_models(self, models_to_train=None):
        """Train all models in sequence"""
        if models_to_train is None:
            models_to_train = ['drug_classifier', 'authenticity_verifier', 'pill_detector']
        
        model_configs = {
            'drug_classifier': ('train_drug_classifier.py', 'drug_classifier_config.json'),
            'authenticity_verifier': ('train_authenticity_verifier.py', 'authenticity_config.json'),
            'pill_detector': ('train_pill_detector.py', 'pill_detection_config.json')
        }
        
        successful_models = []
        failed_models = []
        
        for model_name in models_to_train:
            if model_name not in model_configs:
                logger.error(f"Unknown model: {model_name}")
                failed_models.append(model_name)
                continue
            
            script_name, config_name = model_configs[model_name]
            
            success = self.train_model(model_name, script_name, config_name)
            
            if success:
                successful_models.append(model_name)
            else:
                failed_models.append(model_name)
                logger.error(f"Training failed for {model_name}, continuing with next model...")
        
        return successful_models, failed_models
    
    def generate_training_report(self):
        """Generate a comprehensive training report"""
        report = {
            'training_session': {
                'timestamp': datetime.now().isoformat(),
                'project_root': str(self.project_root),
                'models_trained': len([m for m in self.training_status.values() if m['status'] == 'completed'])
            },
            'models': self.training_status,
            'summary': {
                'total_models': len(self.training_status),
                'completed': len([m for m in self.training_status.values() if m['status'] == 'completed']),
                'failed': len([m for m in self.training_status.values() if m['status'] == 'failed']),
                'pending': len([m for m in self.training_status.values() if m['status'] == 'pending'])
            }
        }
        
        # Calculate training durations
        for model_name, status in self.training_status.items():
            if status['start_time'] and status['end_time']:
                duration = status['end_time'] - status['start_time']
                status['duration_seconds'] = duration.total_seconds()
                status['duration_human'] = str(duration)
        
        # Save report
        report_path = self.training_dir / f"training_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Training report saved to: {report_path}")
        return report
    
    def print_summary(self):
        """Print training summary"""
        print("\\n" + "="*60)
        print("PHARMACEUTICAL AI MODEL TRAINING SUMMARY")
        print("="*60)
        
        for model_name, status in self.training_status.items():
            status_symbol = {
                'completed': '✅',
                'failed': '❌',
                'running': '🔄',
                'pending': '⏳'
            }.get(status['status'], '❓')
            
            print(f"{status_symbol} {model_name.upper()}: {status['status'].upper()}")
            
            if status['start_time']:
                print(f"   Started: {status['start_time'].strftime('%Y-%m-%d %H:%M:%S')}")
            
            if status['end_time']:
                print(f"   Ended: {status['end_time'].strftime('%Y-%m-%d %H:%M:%S')}")
                
            if 'duration_human' in status:
                print(f"   Duration: {status['duration_human']}")
                
            if status['error']:
                print(f"   Error: {status['error']}")
            
            print()

def main():
    parser = argparse.ArgumentParser(description='Train Professional Drug Analysis Models')
    parser.add_argument('--models', nargs='+', 
                       choices=['drug_classifier', 'authenticity_verifier', 'pill_detector'],
                       help='Specific models to train (default: all)')
    parser.add_argument('--skip-requirements', action='store_true',
                       help='Skip requirements installation')
    parser.add_argument('--project-root', 
                       default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       help='Project root directory')
    
    args = parser.parse_args()
    
    logger.info("🚀 Starting Professional Drug Analysis Model Training")
    logger.info(f"Project root: {args.project_root}")
    
    orchestrator = ModelTrainingOrchestrator(args.project_root)
    
    # Check prerequisites
    if not orchestrator.check_prerequisites():
        logger.error("Prerequisites check failed. Please fix the issues and try again.")
        sys.exit(1)
    
    # Install requirements
    if not args.skip_requirements:
        if not orchestrator.install_requirements():
            logger.error("Failed to install requirements")
            sys.exit(1)
    
    # Train models
    start_time = time.time()
    successful_models, failed_models = orchestrator.train_all_models(args.models)
    end_time = time.time()
    
    total_duration = end_time - start_time
    
    # Generate report
    report = orchestrator.generate_training_report()
    
    # Print summary
    orchestrator.print_summary()
    
    print(f"Total training time: {total_duration:.2f} seconds ({total_duration/60:.1f} minutes)")
    print(f"Successful models: {len(successful_models)}")
    print(f"Failed models: {len(failed_models)}")
    
    if failed_models:
        print(f"Failed models: {', '.join(failed_models)}")
        sys.exit(1)
    else:
        print("🎉 All models trained successfully!")

if __name__ == "__main__":
    main()