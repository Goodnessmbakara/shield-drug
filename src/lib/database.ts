import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL!;

console.log('MONGODB_URI:', MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env.local');
}

// Environment variable configuration with fallback defaults
const CONFIG = {
  connectTimeoutMs: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '10000'),
  socketTimeoutMs: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000'),
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
  maxRetries: parseInt(process.env.MONGODB_MAX_RETRIES || '3'),
  retryDelayMs: parseInt(process.env.MONGODB_RETRY_DELAY_MS || '1000'),
  heartbeatFrequencyMs: parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS || '10000'),
  maxIdleTimeMs: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000')
};

// Enhanced connection state tracking
interface ConnectionState {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
  state: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastAttempt: number;
  retryCount: number;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: ConnectionState = global.mongoose || {
  conn: null,
  promise: null,
  state: 'disconnected',
  lastAttempt: 0,
  retryCount: 0
};

if (!global.mongoose) {
  global.mongoose = cached;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: ConnectionState | undefined;
}

// Enhanced connection options for serverless environments
function getConnectionOptions(): mongoose.ConnectOptions {
  return {
    // Serverless optimization
    bufferCommands: false,
    
    // Connection timeouts
    serverSelectionTimeoutMS: CONFIG.connectTimeoutMs,
    socketTimeoutMS: CONFIG.socketTimeoutMs,
    
    // Connection pooling
    maxPoolSize: CONFIG.maxPoolSize,
    minPoolSize: CONFIG.minPoolSize,
    maxIdleTimeMS: CONFIG.maxIdleTimeMs,
    
    // Write operations
    retryWrites: true,
    
    // Connection health monitoring
    heartbeatFrequencyMS: CONFIG.heartbeatFrequencyMs,
    
    // Additional optimizations
    compressors: ['zlib'],
    zlibCompressionLevel: 6,
    
    // Connection monitoring
    monitorCommands: process.env.NODE_ENV === 'development'
  };
}

// Retry logic with exponential backoff and jitter
async function connectWithRetry(
  uri: string,
  options: mongoose.ConnectOptions,
  maxRetries: number,
  baseDelay: number
): Promise<mongoose.Connection> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add jitter to prevent thundering herd in serverless environments
      const jitter = Math.random() * 0.1 * baseDelay;
      const delay = baseDelay * Math.pow(2, attempt - 1) + jitter;
      
      if (attempt > 1) {
        console.log(`Database connection retry attempt ${attempt}/${maxRetries}, waiting ${delay.toFixed(0)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      try {
        const mongooseInstance = await mongoose.connect(uri, options);
        
        // Set up connection event listeners for monitoring
        const connection = mongooseInstance.connection;
        
        connection.on('connected', () => {
          console.log('MongoDB connection established successfully');
        });
        
        connection.on('error', (error) => {
          console.error('MongoDB connection error:', error.message);
          cached.state = 'error';
        });
        
        connection.on('disconnected', () => {
          console.warn('MongoDB connection disconnected');
          cached.state = 'disconnected';
          cached.conn = null;
        });
        
        connection.on('reconnected', () => {
          console.log('MongoDB connection reconnected');
          cached.state = 'connected';
        });
        
        return connection;
      } catch (connectError) {
        throw connectError;
      }
      
    } catch (error) {
      lastError = error as Error;
      
      // Log specific error types
      if (error instanceof Error) {
        if (error.name === 'MongoServerSelectionError') {
          console.error(`Database connection attempt ${attempt} failed: Server selection timeout`);
        } else if (error.name === 'MongoNetworkError') {
          console.error(`Database connection attempt ${attempt} failed: Network error`);
        } else if (error.name === 'MongoParseError') {
          console.error(`Database connection attempt ${attempt} failed: Connection string parse error`);
        } else if (error.name === 'AbortError') {
          console.error(`Database connection attempt ${attempt} failed: Connection timeout`);
        } else {
          console.error(`Database connection attempt ${attempt} failed: ${error.message}`);
        }
      }
      
      // Don't retry on certain error types
      if (error instanceof Error && 
          (error.name === 'MongoParseError' || 
           error.message.includes('authentication') ||
           error.message.includes('unauthorized'))) {
        break;
      }
    }
  }
  
  // All retries exhausted
  const errorMessage = lastError 
    ? `Database connection failed after ${maxRetries} attempts: ${lastError.message}`
    : `Database connection failed after ${maxRetries} attempts`;
  
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Connection health validation
function isConnectionHealthy(connection: mongoose.Connection): boolean {
  if (!connection) return false;
  
  // Check connection ready state
  const readyState = connection.readyState;
  if (readyState !== 1) { // 1 = connected
    console.warn(`Database connection not ready, state: ${readyState}`);
    return false;
  }
  
  // Additional health checks can be added here
  return true;
}

async function dbConnect(): Promise<mongoose.Connection> {
  if (!cached) {
    cached = global.mongoose = {
      conn: null,
      promise: null,
      state: 'disconnected',
      lastAttempt: 0,
      retryCount: 0
    };
  }
  
  // Check if we have a healthy cached connection
  if (cached.conn && isConnectionHealthy(cached.conn)) {
    return cached.conn;
  }
  
  // Clear invalid cached connection
  if (cached.conn && !isConnectionHealthy(cached.conn)) {
    console.warn('Clearing invalid cached database connection');
    cached.conn = null;
    cached.state = 'disconnected';
  }
  
  // Prevent multiple simultaneous connection attempts
  if (cached.promise && cached.state === 'connecting') {
    console.log('Database connection already in progress, waiting...');
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (error) {
      // If the ongoing connection failed, clear it and retry
      cached.promise = null;
      cached.state = 'error';
      throw error;
    }
  }
  
  // Start new connection attempt
  cached.state = 'connecting';
  cached.lastAttempt = Date.now();
  
  const options = getConnectionOptions();
  
  cached.promise = connectWithRetry(
    MONGODB_URI,
    options,
    CONFIG.maxRetries,
    CONFIG.retryDelayMs
  ).then((connection) => {
    cached.conn = connection;
    cached.state = 'connected';
    cached.retryCount = 0;
    return connection;
  }).catch((error) => {
    cached.promise = null;
    cached.state = 'error';
    cached.retryCount++;
    throw error;
  });
  
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.state = 'error';
    throw error;
  }
  
  return cached.conn;
}

export default dbConnect; 