import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] Warning: Could not connect to MongoDB at ${config.mongoUri}`);
    console.warn(`[Database] Detail: ${error.message}`);
    console.warn(`[Database] Continuing in standalone/offline mode for agent loop testing.`);
    return null;
  }
}
