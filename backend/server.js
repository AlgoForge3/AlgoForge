require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const connectDB  = require('./config/db');
const Problem    = require('./models/Problem');
const Submission = require('./models/Submission');
const { executeCode } = require('./services/dockerService');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());

// ── Problem Routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/problems
 * Returns all problems (lightweight: no testCases field).
 */
app.get('/api/problems', async (req, res) => {
  try {
    const problems = await Problem
      .find({})
      .select('-testCases -starterCode.__v')  // exclude heavy/hidden fields
      .sort({ problemNumber: 1 });
    return res.json(problems);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch problems.' });
  }
});

/**
 * GET /api/problems/:id
 * Returns full problem data by problemNumber (used by the editor page).
 * testCases are excluded — they are only used server-side during execution.
 */
app.get('/api/problems/:id', async (req, res) => {
  try {
    const problem = await Problem
      .findOne({ problemNumber: Number(req.params.id) })
      .select('-testCases');        // keep testCases secret
    if (!problem) {
      return res.status(404).json({ error: `Problem #${req.params.id} not found.` });
    }
    return res.json(problem);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch problem.' });
  }
});

// ── Execution Route ───────────────────────────────────────────────────────────

/**
 * POST /api/execute
 * Body: { language, code, problemId }
 *
 * Fetches problem metadata + test cases from MongoDB,
 * generates a LeetCode-style wrapper, runs it inside Docker,
 * and saves a Submission record.
 */
app.post('/api/execute', async (req, res) => {
  const { language, code, problemId } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: '`language` and `code` are required.' });
  }

  // Fetch full problem (including testCases) from DB
  let problem;
  try {
    problem = await Problem.findOne({ problemNumber: Number(problemId) });
  } catch (err) {
    return res.status(500).json({ error: 'Database error while fetching problem.' });
  }

  if (!problem) {
    return res.status(404).json({ error: `Problem #${problemId} not found.` });
  }

  // Build problemMeta for the dynamic wrapper generator
  const problemMeta = {
    functionName: problem.functionName,
    returnType:   problem.returnType,
    parameters:   problem.parameters,
  };

  const startTime = Date.now();

  try {
    const result = await executeCode(language, code, problemMeta, problem.testCases);
    const executionTime = Date.now() - startTime;

    if (result.error) {
      // Save failed submission
      await Submission.create({
        problemId:     problem._id,
        problemNumber: problem.problemNumber,
        language,
        code,
        status:        result.error.includes('Time Limit') ? 'Time Limit Exceeded'
                     : result.error.includes('compile')    ? 'Compile Error'
                     : 'Runtime Error',
        executionTime: null,
        passedCases:   0,
        totalCases:    problem.testCases.length,
      }).catch(() => {});   // don't block response on DB write failure

      return res.status(400).json({ error: result.error });
    }

    const passedCases = result.results.filter(r => r.passed).length;
    const allPassed   = passedCases === result.results.length;

    // Save submission
    await Submission.create({
      problemId:     problem._id,
      problemNumber: problem.problemNumber,
      language,
      code,
      status:        allPassed ? 'Accepted' : 'Wrong Answer',
      executionTime,
      passedCases,
      totalCases:    result.results.length,
    }).catch(() => {});

    return res.json({ results: result.results });
  } catch (err) {
    console.error('Execution error:', err);
    return res.status(500).json({ error: 'Internal server error during execution.' });
  }
});

// ── Submission Routes (bonus) ─────────────────────────────────────────────────

/**
 * GET /api/submissions
 * Returns recent 20 submissions across all problems.
 */
app.get('/api/submissions', async (req, res) => {
  try {
    const subs = await Submission
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-code');     // don't return the full code
    return res.json(subs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  AlgoForge backend running on http://localhost:${PORT}`);
});
