const mongoose = require('mongoose');

// ── Test Case sub-schema ──────────────────────────────────────────────────────
const testCaseSchema = new mongoose.Schema(
  {
    /** Named parameter inputs, e.g. { nums: [2,7], target: 9 } */
    inputs:   { type: mongoose.Schema.Types.Mixed, required: true },
    /** Expected output — can be array, number, boolean, or string */
    expected: { type: mongoose.Schema.Types.Mixed, required: true },
    /** Human-readable display string shown in the Testcase tab */
    display:  { type: String, default: '' },
  },
  { _id: false }
);

// ── Parameter sub-schema ──────────────────────────────────────────────────────
const parameterSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },   // e.g. "vector<int>"
    name: { type: String, required: true },   // e.g. "nums"
  },
  { _id: false }
);

// ── Starter-code sub-schema ───────────────────────────────────────────────────
const starterCodeSchema = new mongoose.Schema(
  {
    cpp:        { type: String, default: '' },
    java:       { type: String, default: '' },
    python:     { type: String, default: '' },
    javascript: { type: String, default: '' },
  },
  { _id: false }
);

// ── Main Problem schema ───────────────────────────────────────────────────────
const problemSchema = new mongoose.Schema(
  {
    /** Sequential numeric id used by the frontend & execution engine. */
    problemNumber: { type: Number, required: true, unique: true },

    title:       { type: String, required: true, trim: true },
    difficulty:  { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    description: { type: String, required: true },
    topics:      { type: [String], default: [] },   // e.g. ['Array', 'Hash Table']
    acceptance:  { type: String, default: '' },     // e.g. "49.1%"

    // ── Execution metadata ──────────────────────────────────────────────────
    functionName: { type: String, required: true }, // e.g. "twoSum"
    returnType:   { type: String, required: true }, // e.g. "vector<int>"
    parameters:   { type: [parameterSchema], default: [] },

    // ── Starter code shown in the editor ───────────────────────────────────
    starterCode: { type: starterCodeSchema, default: () => ({}) },

    // ── Graded test cases (hidden from the frontend) ────────────────────────
    testCases: { type: [testCaseSchema], default: [] },

    // ── Display examples (shown in the description panel) ───────────────────
    examples: {
      type: [
        {
          input:       { type: String },
          output:      { type: String },
          explanation: { type: String, default: null },
          _id: false,
        },
      ],
      default: [],
    },

    constraints: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Problem', problemSchema);
