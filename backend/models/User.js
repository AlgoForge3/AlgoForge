const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Password is nullable for Google-only accounts (they get a random hashed pw internally)
    password:     { type: String, required: false },
    currentLevel: { type: String, default: 'Beginner' },
    solvedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Problem',
      },
    ],
    // ── OAuth ──────────────────────────────────────────────────────────────
    googleId:     { type: String, default: null },
    picture:      { type: String, default: null },   // Google profile photo URL
    authProvider: { type: String, default: 'local', enum: ['local', 'google'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
