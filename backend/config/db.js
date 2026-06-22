import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://yt:Yesh21@backend.ac6uwjl.mongodb.net/Ai-class');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    console.log('⚠️  WARNING: Backend is running with an IN-MEMORY simulated database fallback.');
    isConnected = false;
  }
};

export { connectDB, isConnected };
