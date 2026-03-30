const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { executeCode } = require('./services/dockerService');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/execute', async (req, res) => {
  const { language, code, testCases } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: 'language and code are required' });
  }

  // Use provided testCases or a safe default
  const tcs = Array.isArray(testCases) && testCases.length > 0
    ? testCases
    : [{ input: [1, 2, 3, 4, 5], expected: [1, 2, 3, 4, 5] }];

  try {
    const result = await executeCode(language, code, tcs);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ results: result.results });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error during execution' });
  }
});

app.listen(PORT, () => {
  console.log(`AlgoForge backend running on port ${PORT}`);
});
