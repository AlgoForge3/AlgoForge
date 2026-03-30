const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { generateWrapper } = require('../utils/languageTemplates');

const TIMEOUT_MS = 60000;

/**
 * Parse per-testcase results from Docker stdout.
 * Expected line format:  TC0:val1,val2,...
 *
 * Comparison is type-aware using problemMeta.returnType.
 */
function parseResults(stdout, testCases, returnType) {
  const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
  const isVector = /vector|List|int\[\]|long\[\]/.test(returnType || '');
  const isBool   = /bool|boolean/.test(returnType || '');

  return testCases.map((tc, idx) => {
    const marker = `TC${idx}:`;
    const line   = lines.find(l => l.startsWith(marker));

    // Normalize expected to a comparable string
    let expectedStr;
    if (Array.isArray(tc.expected)) {
      expectedStr = tc.expected.join(',');
    } else if (typeof tc.expected === 'boolean') {
      expectedStr = tc.expected ? 'true' : 'false';
    } else {
      expectedStr = String(tc.expected);
    }

    if (!line) {
      return {
        input:    tc.inputs,
        expected: isVector ? `[${expectedStr}]` : expectedStr,
        output:   null,
        passed:   false,
        status:   'no_output',
      };
    }

    const raw = line.substring(marker.length).trim();

    // Build display strings
    const displayOut = isVector ? `[${raw}]` : raw;
    const displayExp = isVector ? `[${expectedStr}]` : expectedStr;

    return {
      input:    tc.inputs,
      expected: displayExp,
      output:   displayOut,
      passed:   raw === expectedStr,
      status:   raw === expectedStr ? 'passed' : 'wrong_answer',
    };
  });
}

/**
 * @param {string} language
 * @param {string} userCode
 * @param {object} problemMeta  — { functionName, returnType, parameters }
 * @param {Array}  testCases    — [{ inputs, expected, display }]
 */
async function executeCode(language, userCode, problemMeta, testCases) {
  const uuid   = uuidv4();
  const tmpDir = path.resolve(__dirname, '..', 'tmp', uuid);

  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch {
    return { error: 'Failed to create temp directory' };
  }

  // Generate the complete source file
  let wrapperCode;
  try {
    wrapperCode = generateWrapper(language, userCode, problemMeta, testCases);
  } catch (e) {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    return { error: e.message };
  }

  const dockerMountPath = `"${tmpDir}:/usr/src/app"`;
  let fileName, runCommand;

  switch (language) {
    case 'cpp':
      fileName   = 'script.cpp';
      runCommand = `docker run --rm --network=none -v ${dockerMountPath} -w /usr/src/app gcc:latest sh -c "g++ -O2 script.cpp -o script.out && ./script.out"`;
      break;
    case 'java':
      fileName   = 'Main.java';
      runCommand = `docker run --rm --network=none -v ${dockerMountPath} -w /usr/src/app openjdk:17-slim sh -c "javac Main.java && java Main"`;
      break;
    case 'python':
      fileName   = 'script.py';
      runCommand = `docker run --rm --network=none -v ${dockerMountPath} -w /usr/src/app python:3.9-slim sh -c "python script.py"`;
      break;
    default:
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      return { error: `Unsupported language: ${language}` };
  }

  try {
    await fs.writeFile(path.join(tmpDir, fileName), wrapperCode);

    return await new Promise((resolve) => {
      exec(runCommand, { timeout: TIMEOUT_MS }, async (error, stdout, stderr) => {
        fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

        if (error) {
          if (error.signal === 'SIGTERM' || error.killed) {
            return resolve({ error: 'Time Limit Exceeded (60s)' });
          }
          return resolve({ error: (stderr || stdout || error.message).trim() });
        }
        if (stderr) {
          return resolve({ error: stderr.trim() });
        }

        const results = parseResults(stdout, testCases, problemMeta.returnType);
        return resolve({ results });
      });
    });

  } catch (err) {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    return { error: 'Execution Service Error: ' + err.message };
  }
}

module.exports = { executeCode };
