const mongoose = require('mongoose');

const assessmentQuestionSchema = new mongoose.Schema(
  {
    question:      { type: String, required: true },
    options:       { type: [String], required: true },
    correctAnswer: { type: String, required: true },
    difficulty:    { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    topic:         { type: String, default: 'General' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssessmentQuestion', assessmentQuestionSchema);
