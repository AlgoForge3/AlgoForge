const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the URI in .env
 * Exits the process if the connection fails.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI is not defined in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
