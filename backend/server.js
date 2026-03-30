const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { executeCode } = require('./services/dockerService');
const { getProblemById } = require('./data/problems');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

/**
 * POST /api/execute
 * Body: { language, code, problemId }
 *
 * The server fetches problem metadata and test cases from the registry,
 * generates a LeetCode-style wrapper, and runs it inside Docker.
 */
app.post('/api/execute', async (req, res) => {
  const { language, code, problemId } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: '`language` and `code` are required.' });
  }

  // Look up problem metadata from the backend registry
  const problem = getProblemById(problemId);
  if (!problem) {
    return res.status(404).json({
      error: `Problem with id "${problemId}" not found in the registry.`,
    });
  }

  const { testCases, ...problemMeta } = problem; // split meta from test cases

  try {
    const result = await executeCode(language, code, problemMeta, testCases);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ results: result.results });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error during execution.' });
  }
});

app.listen(PORT, () => {
  console.log(`AlgoForge backend running on port ${PORT}`);
});
