const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    username:     { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Password is nullable for Google-only accounts (they get a random hashed pw internally)
    password:     { type: String, required: false },
    currentLevel:        { type: String, default: 'Beginner' },
    assessmentCompleted: { type: Boolean, default: false },
    assessmentScore:     { type: Number, default: null },
    solvedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Problem',
      },
    ],

    // ── Profile fields ──────────────────────────────────────────────────────
    bio:          { type: String, default: '', maxlength: 300 },
    location:     { type: String, default: '' },
    website:      { type: String, default: '' },
    github:       { type: String, default: '' },
    linkedin:     { type: String, default: '' },

    // ── OAuth ──────────────────────────────────────────────────────────────
    googleId:     { type: String, default: null },
    picture:      { type: String, default: null },   // Google profile photo URL
    authProvider: { type: String, default: 'local', enum: ['local', 'google'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
