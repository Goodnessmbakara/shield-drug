import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

interface DatabaseConnection {
  db: mongoose.Connection;
  client: mongoose.MongoClient;
}

let cachedConnection: DatabaseConnection | null = null;

export async function connectToDatabase(): Promise<DatabaseConnection> {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    // Connect to MongoDB
    const connection = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = {
      db: connection.connection,
      client: connection.connection.client
    };

    console.log('✅ Connected to MongoDB successfully');
    return cachedConnection;

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    
    // Return a mock connection for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Using mock database connection for development');
      return {
        db: {} as any,
        client: {} as any
      };
    }
    
    throw error;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
