const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:     { type: String, required: true },
    currentLevel: { type: String, default: 'Beginner' },
    solvedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Problem',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
