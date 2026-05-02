require('dotenv').config({ override: true });
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const connectDB  = require('./config/db');
const Problem    = require('./models/Problem');
const Submission = require('./models/Submission');
const User       = require('./models/User');
const { executeCode } = require('./services/dockerService');
const geminiService = require('./services/geminiService');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const { protect } = require('./middleware/authMiddleware');

const app  = express();
const PORT = process.env.PORT || 5000;
const SUBMIT_HIDDEN_TEST_CASE_COUNT = 28;

const getExecutionStatusFromError = (message = '') => {
  if (message.includes('Time Limit')) return 'Time Limit Exceeded';
  if (message.toLowerCase().includes('compile')) return 'Compile Error';
  return 'Runtime Error';
};

const countDescriptionOutputs = (html = '') => {
  const regex = /Output(.*?):\s*<\/strong>\s*(?:<em>)?(.*?)(?:<\/em>)?(?=<|\n)/gi;
  let count = 0;
  while (regex.exec(html) !== null) {
    count += 1;
  }
  return count;
};

const getProblemCaseBuckets = (problem) => {
  if (Array.isArray(problem.publicTestCases) && problem.publicTestCases.length > 0) {
    return {
      publicTestCases: problem.publicTestCases,
      storedHiddenTestCases: Array.isArray(problem.testCases) ? problem.testCases : [],
    };
  }

  const mixedCases = Array.isArray(problem.testCases) ? problem.testCases : [];
  const describedPublicCount = Array.isArray(problem.examples) && problem.examples.length > 0
    ? problem.examples.length
    : countDescriptionOutputs(problem.description);

  if (describedPublicCount > 0 && mixedCases.length > describedPublicCount) {
    return {
      publicTestCases: mixedCases.slice(0, describedPublicCount),
      storedHiddenTestCases: mixedCases.slice(describedPublicCount),
    };
  }

  return {
    publicTestCases: mixedCases,
    storedHiddenTestCases: [],
  };
};

const buildSubmitDisplayResults = (publicResults, overallStatus, hiddenFailure) => {
  const failedPublicResults = publicResults.filter((result) => !result.passed);
  if (failedPublicResults.length > 0) {
    return {
      results: failedPublicResults,
      mode: 'failed_only',
      note: 'Showing failed public test cases only.',
    };
  }

  if (publicResults.length > 0) {
    return {
      results: [publicResults[0]],
      mode: 'sample',
      note: hiddenFailure
        ? 'No public sample failed, so showing the first public testcase. Final verdict was affected by hidden grading.'
        : 'Showing the first public testcase and your stdout.',
    };
  }

  return {
    results: [],
    mode: 'summary_only',
    note: overallStatus === 'Accepted'
      ? 'All public and hidden checks passed.'
      : 'Hidden grading decided the final verdict.',
  };
};

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Expires', 'Pragma']
}));
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
      .select('-testCases -publicTestCases -starterCode.__v')  // exclude heavy/hidden fields
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

    let problem = await Problem.findOne(query).select('-testCases -publicTestCases');
    
    // If not found by slug, or it's a skeleton — auto-fetch full data from LeetCode
    if ((!problem || problem.isSkeleton) && !isNumeric) {
      console.log(`[Auto-Sync] Fetching full details for ${idParam} from LeetCode...`);
      const { syncLeetcodeProblems } = require('./controllers/leetcodeController');
      const fakeReq = { body: { slugs: [idParam] } };
      const fakeRes = { status: () => ({ json: () => {} }), json: () => {} };
      await syncLeetcodeProblems(fakeReq, fakeRes);
      
      // Retry fetching from DB after sync
      problem = await Problem.findOne(query).select('-testCases -publicTestCases');
    }

    // Also auto-sync numeric lookups when the problem is a skeleton
    if (problem && problem.isSkeleton && isNumeric && problem.titleSlug) {
      console.log(`[Auto-Sync] Fetching full details for #${idParam} (${problem.titleSlug}) from LeetCode...`);
      const { syncLeetcodeProblems } = require('./controllers/leetcodeController');
      const fakeReq = { body: { slugs: [problem.titleSlug] } };
      const fakeRes = { status: () => ({ json: () => {} }), json: () => {} };
      await syncLeetcodeProblems(fakeReq, fakeRes);
      
      // Retry fetching from DB after sync
      problem = await Problem.findOne(query).select('-testCases -publicTestCases');
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
  const action = req.body.action || 'submit';

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
  const { publicTestCases, storedHiddenTestCases } = getProblemCaseBuckets(problem);

  const startTime = Date.now();

  try {
    const visibleResult = await executeCode(language, code, problemMeta, publicTestCases);
    const executionTime = Date.now() - startTime;
    console.log(
      `[Execute] User ${req.user._id} (${req.user.name}) action: ${action}, result:`,
      visibleResult.results?.length,
      'test cases'
    );

    if (visibleResult.error) {
      if (action === 'submit') {
        // Save failed submission
        await Submission.create({
          userId:        req.user._id,
          problemId:     problem._id,
          problemNumber: problem.problemNumber,
          language,
          code,
          status:        getExecutionStatusFromError(visibleResult.error),
          executionTime: null,
          passedCases:   0,
          totalCases:    publicTestCases.length + storedHiddenTestCases.length,
        }).catch(() => {});   // don't block response on DB write failure
      }

      return res.status(400).json({
        error: visibleResult.error,
        stdout: visibleResult.stdout || '',
        stderr: visibleResult.stderr || '',
      });
    }

    const visiblePassedCases = visibleResult.results.filter((result) => result.passed).length;
    const visibleTotalCases = visibleResult.results.length;
    const visibleAllPassed = visiblePassedCases === visibleTotalCases;
    let finalPassedCases = visiblePassedCases;
    let finalTotalCases = visibleTotalCases;
    let finalStatus = visibleAllPassed ? 'Accepted' : 'Wrong Answer';
    let submissionSummary = null;
    let responseResults = visibleResult.results;

    if (action === 'submit') {
      const aiHiddenCases = await geminiService.generateHiddenTestCases(
        {
          title: problem.title,
          difficulty: problem.difficulty,
          description: problem.description,
          functionName: problem.functionName,
          returnType: problem.returnType,
          parameters: problem.parameters,
          constraints: problem.constraints,
        },
        publicTestCases,
        SUBMIT_HIDDEN_TEST_CASE_COUNT
      );
      const hiddenJudgeCases = [...storedHiddenTestCases, ...aiHiddenCases];

      let hiddenPassedCases = 0;
      let hiddenError = '';

      if (hiddenJudgeCases.length > 0) {
        const hiddenResult = await executeCode(language, code, problemMeta, hiddenJudgeCases);
        if (hiddenResult.error) {
          hiddenError = hiddenResult.error;
        } else {
          hiddenPassedCases = hiddenResult.results.filter((result) => result.passed).length;
        }
      }

      finalPassedCases += hiddenPassedCases;
      finalTotalCases += hiddenJudgeCases.length;

      const hiddenAllPassed = hiddenJudgeCases.length === 0
        ? true
        : (!hiddenError && hiddenPassedCases === hiddenJudgeCases.length);

      finalStatus = hiddenError
        ? getExecutionStatusFromError(hiddenError)
        : (visibleAllPassed && hiddenAllPassed ? 'Accepted' : 'Wrong Answer');

      const submitPanel = buildSubmitDisplayResults(
        visibleResult.results,
        finalStatus,
        Boolean(hiddenError || !hiddenAllPassed)
      );
      responseResults = submitPanel.results;

      submissionSummary = {
        mode: 'submit',
        overallStatus: finalStatus,
        publicPassed: visiblePassedCases,
        publicTotal: visibleTotalCases,
        hiddenPassed: hiddenPassedCases,
        hiddenTotal: hiddenJudgeCases.length,
        overallPassed: finalPassedCases,
        overallTotal: finalTotalCases,
        aiGeneratedCount: aiHiddenCases.length,
        storedHiddenCount: storedHiddenTestCases.length,
        hiddenError,
        note: aiHiddenCases.length > 0
          ? `Gemini generated ${aiHiddenCases.length} new hidden test cases for submit-time grading.`
          : 'Gemini hidden test generation was unavailable, so this submit used the stored hidden cases only.',
        resultPanelMode: submitPanel.mode,
        resultPanelNote: submitPanel.note,
      };

      console.log(
        `[Submit] User ${req.user._id} (${req.user.name}) public ${visiblePassedCases}/${visibleTotalCases}, hidden ${hiddenPassedCases}/${hiddenJudgeCases.length}, status=${finalStatus}`
      );
    }

    if (action === 'submit') {
      // Save submission
      await Submission.create({
        userId:        req.user._id,
        problemId:     problem._id,
        problemNumber: problem.problemNumber,
        language,
        code,
        status:        finalStatus,
        executionTime,
        passedCases:   finalPassedCases,
        totalCases:    finalTotalCases,
      }).catch(() => {});

      // Update user's progress if accepted
      if (finalStatus === 'Accepted') {
        await User.findByIdAndUpdate(
          req.user._id,
          { $addToSet: { solvedProblems: problem._id } }
        ).catch(() => {});
      }
    }

    return res.json({
      results: responseResults,
      stdout: visibleResult.stdout || '',
      stderr: visibleResult.stderr || '',
      submissionSummary,
    });
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
