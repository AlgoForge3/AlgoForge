const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:      'Problem',
      required: true,
    },
    /** Numeric problem number for quick lookup without a join. */
    problemNumber: { type: Number, required: true },

    language: {
      type: String,
      enum:     ['cpp', 'java', 'python', 'javascript'],
      required: true,
    },

    code: { type: String, required: true },

    status: {
      type: String,
      enum:    ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compile Error'],
      default: 'Runtime Error',
    },

    /** ms taken inside the Docker container (null if compile failed) */
    executionTime: { type: Number, default: null },

    /** Number of test cases that passed */
    passedCases: { type: Number, default: 0 },
    totalCases:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
