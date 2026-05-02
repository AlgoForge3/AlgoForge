const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DEFAULT_HIDDEN_TEST_CASE_COUNT = 5;
const MAX_HIDDEN_TEST_CASE_COUNT = 30;
const MAX_GENERATION_ATTEMPTS = 5;
const MAX_BATCH_SIZE = 10;

const safeParseJson = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const buildDisplayString = (inputs) => (
  Object.entries(inputs || {})
    .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
    .join('\n')
);

const normalizeGeneratedTestCase = (candidate, parameterNames) => {
  const inputs = safeParseJson(candidate?.inputs);
  const expected = safeParseJson(candidate?.expected);

  if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) {
    return null;
  }

  if (parameterNames.length > 0 && parameterNames.some((name) => !(name in inputs))) {
    return null;
  }

  return {
    inputs,
    expected,
    display: candidate?.display || buildDisplayString(inputs),
  };
};

const requestHiddenTestCaseBatch = async (
  problemData,
  publicTestCases,
  parameterNames,
  requestedCount,
  excludedCaseKeys
) => {
  const parameterSignature = (problemData?.parameters || [])
    .map((param) => `${param.name}: ${param.type}`)
    .join(', ');
  const excludedInputs = Array.from(excludedCaseKeys).slice(0, 40);

  const prompt = `
You are an expert algorithms instructor and competitive programming judge.
Generate exactly ${requestedCount} complex, tricky hidden test cases for the following problem.
Focus on:
1. Maximum and minimum constraints.
2. Edge cases (empty arrays, zeroes, negative numbers, duplicates, single elements) if applicable.
3. Performance-heavy large inputs.
4. Adversarial patterns that often break common incorrect solutions.
5. Diverse cases; do not repeat the same shape with tiny value changes.

### Problem Information
Title: ${problemData.title}
Difficulty: ${problemData.difficulty}
Function Name: ${problemData.functionName}
Return Type: ${problemData.returnType}
Parameters: ${parameterSignature || 'No structured parameters provided'}

### Description
${(problemData.description || '').replace(/<[^>]+>/g, '').substring(0, 2500)}

### Public Test Cases (Do not duplicate these)
${JSON.stringify(publicTestCases, null, 2)}

### Inputs Already Used (Do not repeat these)
${JSON.stringify(excludedInputs, null, 2)}

Rules:
- Return only valid JSON matching the schema.
- Use only the listed parameter names.
- Each "inputs" value must be a JSON-stringified object whose keys exactly match the parameters.
- Each "expected" value must be a JSON-stringified answer that is logically correct.
- Do not duplicate any listed testcase inputs.
- Do not include commentary outside the JSON.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            inputs: {
              type: Type.STRING,
              description: 'A JSON-stringified object mapping parameter names to their values. Example: "{\\"nums\\": [1,2,3], \\"target\\": 4}"'
            },
            expected: {
              type: Type.STRING,
              description: 'The expected output as a JSON string. Example: "[0,2]" or "true" or "42"'
            },
            display: {
              type: Type.STRING,
              description: 'A human-readable string representation of the inputs, e.g. "nums = [1,2,3]\\ntarget = 4"'
            }
          },
          required: ['inputs', 'expected', 'display']
        }
      }
    }
  });

  const generatedText = response.text;
  const parsed = JSON.parse(generatedText);
  const batch = [];

  for (const candidate of Array.isArray(parsed) ? parsed : []) {
    const normalized = normalizeGeneratedTestCase(candidate, parameterNames);
    if (!normalized) continue;

    const caseKey = JSON.stringify(normalized.inputs);
    if (excludedCaseKeys.has(caseKey)) continue;
    if (batch.some((testCase) => JSON.stringify(testCase.inputs) === caseKey)) continue;

    batch.push(normalized);
    if (batch.length >= requestedCount) break;
  }

  return batch;
};

/**
 * Generate hidden test cases for a coding problem using Google Gemini
 * @param {Object} problemData - Basic problem details including title, description, and signature
 * @param {Array} publicTestCases - Existing public test cases to use as context
 * @param {number} desiredCount - Number of hidden test cases to request
 * @returns {Promise<Array>} - Array of generated testcase objects
 */
const generateHiddenTestCases = async (
  problemData,
  publicTestCases,
  desiredCount = DEFAULT_HIDDEN_TEST_CASE_COUNT
) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini Service Warning: GEMINI_API_KEY is not set.');
      return [];
    }

    const count = Math.min(
      Math.max(Number(desiredCount) || DEFAULT_HIDDEN_TEST_CASE_COUNT, 1),
      MAX_HIDDEN_TEST_CASE_COUNT
    );
    const parameterNames = (problemData?.parameters || []).map((param) => param.name);
    const excludedCaseKeys = new Set(
      (publicTestCases || []).map((testCase) => JSON.stringify(testCase.inputs || {}))
    );
    const uniqueCases = [];

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS && uniqueCases.length < count; attempt += 1) {
      const remaining = count - uniqueCases.length;
      const batchSize = Math.min(remaining, MAX_BATCH_SIZE);
      const batch = await requestHiddenTestCaseBatch(
        problemData,
        publicTestCases,
        parameterNames,
        batchSize,
        excludedCaseKeys
      );

      batch.forEach((testCase) => {
        const caseKey = JSON.stringify(testCase.inputs);
        if (excludedCaseKeys.has(caseKey)) return;
        excludedCaseKeys.add(caseKey);
        uniqueCases.push(testCase);
      });
    }

    return uniqueCases.slice(0, count);

  } catch (error) {
    console.error('Gemini Service Error:', error);
    return []; // Return empty array on failure so it doesn't crash the main flow
  }
};

module.exports = {
  generateHiddenTestCases
};
