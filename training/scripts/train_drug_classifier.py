#!/usr/bin/env python3
"""
Drug Classifier Training Script
Trains an EfficientNet-B3 model for pharmaceutical drug classification
"""

import os
import json
import logging
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB3
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TensorBoard
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import tensorflowjs as tfjs
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DrugClassifierTrainer:
    def __init__(self, config_path: str, data_dir: str, output_dir: str):
        self.config_path = Path(config_path)
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load configuration
        with open(self.config_path, 'r') as f:
            self.config = json.load(f)
        
        logger.info(f"Loaded config: {self.config['model_name']}")
    
    def create_data_generators(self):
        """Create data generators with augmentation"""
        aug_config = self.config['data_augmentation']
        
        # Training data generator with augmentation
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=aug_config['rotation_range'],
            width_shift_range=aug_config['width_shift_range'],
            height_shift_range=aug_config['height_shift_range'],
            brightness_range=aug_config['brightness_range'],
            zoom_range=aug_config['zoom_range'],
            horizontal_flip=aug_config['horizontal_flip'],
            validation_split=0.2  # 20% for validation
        )
        
        # Validation data generator (no augmentation)
        val_datagen = ImageDataGenerator(
            rescale=1./255,
            validation_split=0.2
        )
        
        input_shape = self.config['input_shape']
        
        train_generator = train_datagen.flow_from_directory(
            self.data_dir / 'pharmaceutical_images' / 'authentic',
            target_size=(input_shape[0], input_shape[1]),
            batch_size=self.config['batch_size'],
            class_mode='categorical',
            subset='training'
        )
        
        validation_generator = val_datagen.flow_from_directory(
            self.data_dir / 'pharmaceutical_images' / 'authentic',
            target_size=(input_shape[0], input_shape[1]),
            batch_size=self.config['batch_size'],
            class_mode='categorical',
            subset='validation'
        )
        
        self.num_classes = train_generator.num_classes
        logger.info(f"Found {self.num_classes} classes in training data")
        
        return train_generator, validation_generator
    
    def create_model(self):
        """Create EfficientNet-B3 based drug classifier"""
        input_shape = tuple(self.config['input_shape'])
        
        # Load pre-trained EfficientNet-B3
        base_model = EfficientNetB3(
            weights='imagenet',
            include_top=False,
            input_shape=input_shape
        )
        
        # Fine-tuning: freeze first 80% of layers
        freeze_layers = int(len(base_model.layers) * 0.8)
        for layer in base_model.layers[:freeze_layers]:
            layer.trainable = False
        
        # Add custom classification head
        model = tf.keras.Sequential([
            base_model,
            GlobalAveragePooling2D(),
            Dense(512, activation='relu'),
            Dropout(0.3),
            Dense(256, activation='relu'),
            Dropout(0.2),
            Dense(self.num_classes, activation='softmax', name='drug_classification')
        ])
        
        # Compile model
        optimizer = Adam(learning_rate=self.config['learning_rate'])
        model.compile(
            optimizer=optimizer,
            loss=self.config['loss'],
            metrics=self.config['metrics']
        )
        
        logger.info(f"Created model with {self.num_classes} classes")
        return model
    
    def create_callbacks(self):
        """Create training callbacks"""
        callbacks = []
        
        # Early stopping
        if 'early_stopping' in self.config['callbacks']:
            es_config = self.config['callbacks']['early_stopping']
            callbacks.append(
                EarlyStopping(
                    patience=es_config['patience'],
                    restore_best_weights=True,
                    verbose=1
                )
            )
        
        # Reduce learning rate
        if 'reduce_lr' in self.config['callbacks']:
            lr_config = self.config['callbacks']['reduce_lr']
            callbacks.append(
                ReduceLROnPlateau(
                    patience=lr_config['patience'],
                    factor=lr_config['factor'],
                    verbose=1
                )
            )
        
        # Model checkpoint
        if 'model_checkpoint' in self.config['callbacks']:
            callbacks.append(
                ModelCheckpoint(
                    filepath=self.output_dir / 'best_model.h5',
                    save_best_only=True,
                    verbose=1
                )
            )
        
        # TensorBoard
        callbacks.append(
            TensorBoard(
                log_dir=self.output_dir / 'logs',
                histogram_freq=1
            )
        )
        
        return callbacks
    
    def train(self):
        """Train the drug classifier model"""
        logger.info("Starting drug classifier training...")
        
        # Create data generators
        train_gen, val_gen = self.create_data_generators()
        
        # Create model
        model = self.create_model()
        
        # Create callbacks
        callbacks = self.create_callbacks()
        
        # Train model
        history = model.fit(
            train_gen,
            epochs=self.config['epochs'],
            validation_data=val_gen,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save final model
        model.save(self.output_dir / 'drug_classifier.h5')
        
        # Convert to TensorFlow.js format
        tfjs.converters.save_keras_model(
            model, 
            str(self.output_dir / 'tfjs_model')
        )
        
        # Save class labels
        class_labels = {v: k for k, v in train_gen.class_indices.items()}
        with open(self.output_dir / 'class_labels.json', 'w') as f:
            json.dump(class_labels, f, indent=2)
        
        # Save training history
        with open(self.output_dir / 'training_history.json', 'w') as f:
            # Convert numpy arrays to lists for JSON serialization
            history_dict = {k: [float(x) for x in v] for k, v in history.history.items()}
            json.dump(history_dict, f, indent=2)
        
        logger.info("✅ Drug classifier training completed!")
        logger.info(f"Model saved to: {self.output_dir}")
        logger.info(f"TensorFlow.js model saved to: {self.output_dir / 'tfjs_model'}")
        
        return model, history

def main():
    """Main training function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Drug Classifier')
    parser.add_argument('--config', required=True, help='Config file path')
    parser.add_argument('--data', required=True, help='Data directory path')
    parser.add_argument('--output', required=True, help='Output directory path')
    
    args = parser.parse_args()
    
    trainer = DrugClassifierTrainer(args.config, args.data, args.output)
    trainer.train()

if __name__ == "__main__":
    main()