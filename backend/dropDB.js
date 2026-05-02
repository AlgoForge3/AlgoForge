const mongoose = require('mongoose');
require('dotenv').config();

const dropDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error dropping DB:', err);
    process.exit(1);
  }
};

dropDB();
