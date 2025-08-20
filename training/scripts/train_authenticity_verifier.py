#!/usr/bin/env python3
"""
Authenticity Verifier Training Script
Trains a Siamese ResNet-50 network for pharmaceutical authenticity verification
"""

import os
import json
import logging
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Input, Lambda, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TensorBoard
import tensorflowjs as tfjs
from pathlib import Path
import random

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AuthenticityVerifierTrainer:
    def __init__(self, config_path: str, data_dir: str, output_dir: str):
        self.config_path = Path(config_path)
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load configuration
        with open(self.config_path, 'r') as f:
            self.config = json.load(f)
        
        logger.info(f"Loaded config: {self.config['model_name']}")
    
    def load_image_pairs(self):
        """Load and prepare image pairs for siamese training"""
        authentic_dir = self.data_dir / 'pharmaceutical_images' / 'authentic'
        counterfeit_dir = self.data_dir / 'pharmaceutical_images' / 'counterfeit'
        
        # Get all authentic and counterfeit image paths
        authentic_images = []
        counterfeit_images = []
        
        for drug_dir in authentic_dir.glob('*'):
            if drug_dir.is_dir():
                authentic_images.extend(list(drug_dir.glob('*.jpg')) + list(drug_dir.glob('*.png')))
        
        for drug_dir in counterfeit_dir.glob('*'):
            if drug_dir.is_dir():
                counterfeit_images.extend(list(drug_dir.glob('*.jpg')) + list(drug_dir.glob('*.png')))
        
        logger.info(f"Found {len(authentic_images)} authentic images")
        logger.info(f"Found {len(counterfeit_images)} counterfeit images")
        
        return authentic_images, counterfeit_images
    
    def create_siamese_pairs(self, authentic_images, counterfeit_images, num_pairs=10000):
        """Create pairs for siamese network training"""
        pairs = []
        labels = []
        
        # Create positive pairs (authentic-authentic)
        for i in range(num_pairs // 4):
            if len(authentic_images) >= 2:
                img1, img2 = random.sample(authentic_images, 2)
                pairs.append([str(img1), str(img2)])
                labels.append(1)  # Same class (both authentic)
        
        # Create negative pairs (authentic-counterfeit)
        for i in range(num_pairs // 2):
            if len(authentic_images) > 0 and len(counterfeit_images) > 0:
                img1 = random.choice(authentic_images)
                img2 = random.choice(counterfeit_images)
                pairs.append([str(img1), str(img2)])
                labels.append(0)  # Different classes
        
        # Create negative pairs (counterfeit-counterfeit comparison with authentic reference)
        for i in range(num_pairs // 4):
            if len(counterfeit_images) >= 2:
                img1, img2 = random.sample(counterfeit_images, 2)
                pairs.append([str(img1), str(img2)])
                labels.append(0)  # Both counterfeit (should be flagged as suspicious)
        
        logger.info(f"Created {len(pairs)} training pairs")
        return pairs, labels
    
    def preprocess_image(self, image_path):
        """Preprocess image for model input"""
        image = tf.io.read_file(image_path)
        image = tf.image.decode_image(image, channels=3, dtype=tf.float32)
        image = tf.image.resize(image, self.config['input_shape'][:2])
        image = tf.cast(image, tf.float32) / 255.0
        return image
    
    def create_siamese_model(self):
        """Create Siamese ResNet-50 model for authenticity verification"""
        input_shape = tuple(self.config['input_shape'])
        
        # Create base feature extractor
        base_model = ResNet50(
            weights='imagenet',
            include_top=False,
            input_shape=input_shape
        )
        
        # Fine-tuning: freeze first 70% of layers
        freeze_layers = int(len(base_model.layers) * 0.7)
        for layer in base_model.layers[:freeze_layers]:
            layer.trainable = False
        
        # Feature extraction network
        feature_extractor = tf.keras.Sequential([
            base_model,
            GlobalAveragePooling2D(),
            Dense(512, activation='relu'),
            Dropout(0.3),
            Dense(256, activation='relu', name='features')
        ])
        
        # Siamese network inputs
        input_a = Input(shape=input_shape, name='image_a')
        input_b = Input(shape=input_shape, name='image_b')
        
        # Extract features from both images
        features_a = feature_extractor(input_a)
        features_b = feature_extractor(input_b)
        
        # Calculate L2 distance between features
        distance = Lambda(
            lambda x: tf.sqrt(tf.reduce_sum(tf.square(x[0] - x[1]), axis=1, keepdims=True)),
            name='distance'
        )([features_a, features_b])
        
        # Classification layer (authentic vs counterfeit)
        authenticity_score = Dense(1, activation='sigmoid', name='authenticity')(distance)
        
        model = Model(inputs=[input_a, input_b], outputs=authenticity_score)
        
        # Compile model
        optimizer = Adam(learning_rate=self.config['learning_rate'])
        model.compile(
            optimizer=optimizer,
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        logger.info("Created Siamese authenticity verification model")
        return model
    
    def create_data_generator(self, pairs, labels, batch_size):
        """Create data generator for siamese training"""
        def generator():
            indices = np.arange(len(pairs))
            while True:
                np.random.shuffle(indices)
                for i in range(0, len(indices), batch_size):
                    batch_indices = indices[i:i + batch_size]
                    
                    images_a = []
                    images_b = []
                    batch_labels = []
                    
                    for idx in batch_indices:
                        if idx < len(pairs):
                            img_a = self.preprocess_image(pairs[idx][0])
                            img_b = self.preprocess_image(pairs[idx][1])
                            
                            images_a.append(img_a)
                            images_b.append(img_b)
                            batch_labels.append(labels[idx])
                    
                    if images_a and images_b:
                        yield (
                            [tf.stack(images_a), tf.stack(images_b)], 
                            tf.constant(batch_labels, dtype=tf.float32)
                        )
        
        return generator
    
    def train(self):
        """Train the authenticity verifier model"""
        logger.info("Starting authenticity verifier training...")
        
        # Load image pairs
        authentic_images, counterfeit_images = self.load_image_pairs()
        
        if len(authentic_images) == 0 or len(counterfeit_images) == 0:
            logger.error("Insufficient training data. Need both authentic and counterfeit images.")
            return None, None
        
        # Create training pairs
        pairs, labels = self.create_siamese_pairs(authentic_images, counterfeit_images)
        
        # Split into training and validation
        split_idx = int(0.8 * len(pairs))
        train_pairs, val_pairs = pairs[:split_idx], pairs[split_idx:]
        train_labels, val_labels = labels[:split_idx], labels[split_idx:]
        
        # Create model
        model = self.create_siamese_model()
        
        # Create data generators
        train_gen = self.create_data_generator(train_pairs, train_labels, self.config['batch_size'])
        val_gen = self.create_data_generator(val_pairs, val_labels, self.config['batch_size'])
        
        # Create callbacks
        callbacks = [
            EarlyStopping(patience=10, restore_best_weights=True, verbose=1),
            ReduceLROnPlateau(patience=5, factor=0.5, verbose=1),
            ModelCheckpoint(
                filepath=str(self.output_dir / 'best_authenticity_model.h5'),
                save_best_only=True,
                verbose=1
            ),
            TensorBoard(log_dir=str(self.output_dir / 'logs'), histogram_freq=1)
        ]
        
        # Calculate steps per epoch
        train_steps = len(train_pairs) // self.config['batch_size']
        val_steps = len(val_pairs) // self.config['batch_size']
        
        # Train model
        history = model.fit(
            train_gen(),
            steps_per_epoch=train_steps,
            epochs=self.config['epochs'],
            validation_data=val_gen(),
            validation_steps=val_steps,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save final model
        model.save(self.output_dir / 'authenticity_verifier.h5')
        
        # Convert to TensorFlow.js format
        tfjs.converters.save_keras_model(
            model, 
            str(self.output_dir / 'tfjs_model')
        )
        
        # Save training history
        with open(self.output_dir / 'training_history.json', 'w') as f:
            history_dict = {k: [float(x) for x in v] for k, v in history.history.items()}
            json.dump(history_dict, f, indent=2)
        
        logger.info("✅ Authenticity verifier training completed!")
        logger.info(f"Model saved to: {self.output_dir}")
        logger.info(f"TensorFlow.js model saved to: {self.output_dir / 'tfjs_model'}")
        
        return model, history

def main():
    """Main training function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Authenticity Verifier')
    parser.add_argument('--config', required=True, help='Config file path')
    parser.add_argument('--data', required=True, help='Data directory path')
    parser.add_argument('--output', required=True, help='Output directory path')
    
    args = parser.parse_args()
    
    trainer = AuthenticityVerifierTrainer(args.config, args.data, args.output)
    trainer.train()

if __name__ == "__main__":
    main()