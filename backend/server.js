require('dotenv').config({ override: true });
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const connectDB  = require('./config/db');
const Problem    = require('./models/Problem');
const Submission = require('./models/Submission');
const User       = require('./models/User');
const { executeCode } = require('./services/dockerService');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const { protect } = require('./middleware/authMiddleware');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(bodyParser.json());

// ── Auth Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── User Routes ────────────────────────────────────────────────────────────────
app.use('/api/user', userRoutes);

// ── Assessment Routes ──────────────────────────────────────────────────────────
app.use('/api/assessment', assessmentRoutes);

// ── Problem Routes ─────────────────────────────────────────────────────────────

const { syncLeetcodeProblems } = require('./controllers/leetcodeController');

/**
 * POST /api/problems/leetcode/sync
 * Syncs Leetcode problems to local DB
 */
app.post('/api/problems/leetcode/sync', syncLeetcodeProblems);
app.post('/api/problems/seed-all', async (req, res) => {
  const { seedAllLeetcode } = require('./controllers/leetcodeController');
  await seedAllLeetcode(req, res);
});
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
    const idParam = req.params.id;
    const isNumeric = !isNaN(Number(idParam));
    let query = isNumeric ? { problemNumber: Number(idParam) } : { titleSlug: idParam };

    let problem = await Problem.findOne(query).select('-testCases');
    
    // If not found, or it's a skeleton we haven't fetched full data for yet
    if ((!problem || problem.isSkeleton) && !isNumeric) {
      console.log(`[Auto-Sync] Fetching full details for ${idParam} from LeetCode...`);
      const { syncLeetcodeProblems } = require('./controllers/leetcodeController');
      const fakeReq = { body: { slugs: [idParam] } };
      const fakeRes = { status: () => ({ json: () => {} }), json: () => {} };
      await syncLeetcodeProblems(fakeReq, fakeRes);
      
      // Retry fetching from DB after sync
      problem = await Problem.findOne(query).select('-testCases');
    }

    if (!problem) {
      return res.status(404).json({ error: `Problem ${idParam} not found.` });
    }
    
    // For problems loaded from LeetCode, we might want to return HTML safely, 
    // but the frontend handles `dangerouslySetInnerHTML` or markdown rendering.
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
 * saves a Submission record, and updates User progress on success.
 */
app.post('/api/execute', protect, async (req, res) => {
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
    console.log(`[Execute] User ${req.user._id} (${req.user.name}) result:`, result.results?.length, "test cases");

    if (result.error) {
      // Save failed submission
      await Submission.create({
        userId:        req.user._id,
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
      userId:        req.user._id,
      problemId:     problem._id,
      problemNumber: problem.problemNumber,
      language,
      code,
      status:        allPassed ? 'Accepted' : 'Wrong Answer',
      executionTime,
      passedCases,
      totalCases:    result.results.length,
    }).catch(() => {});

    // Update user's progress if accepted
    if (allPassed) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { solvedProblems: problem._id } }
      ).catch(() => {});
    }

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀  AlgoForge backend running on port ${PORT}`);
});
