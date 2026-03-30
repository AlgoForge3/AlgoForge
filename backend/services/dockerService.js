const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const templates = require('../utils/languageTemplates');

const TIMEOUT_MS = 60000;

/**
 * Parse the Docker stdout to extract per-testcase results.
 * Lines are expected in the format: "TC0:val1,val2"
 */
function parseResults(stdout, testCases) {
  const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
  return testCases.map((tc, idx) => {
    const marker = `TC${idx}:`;
    const line   = lines.find(l => l.startsWith(marker));
    if (!line) {
      return {
        input:    tc.input,
        expected: `[${tc.expected.join(',')}]`,
        output:   null,
        passed:   false,
        status:   'no_output',
      };
    }
    const raw      = line.substring(marker.length).trim();
    const expected = tc.expected.join(',');
    return {
      input:    tc.input,
      expected: `[${expected}]`,
      output:   `[${raw}]`,
      passed:   raw === expected,
      status:   raw === expected ? 'passed' : 'wrong_answer',
    };
  });
}

async function executeCode(language, userCode, testCases) {
  const uuid   = uuidv4();
  const tmpDir = path.resolve(__dirname, '..', 'tmp', uuid);

  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch {
    return { error: 'Failed to create temp directory' };
  }

  const languageObj = templates[language];
  if (!languageObj) {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    return { error: `Unsupported language: ${language}` };
  }

  const wrapperCode     = languageObj.wrapper(userCode, testCases);
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
      return { error: 'Unsupported language' };
  }

  try {
    await fs.writeFile(path.join(tmpDir, fileName), wrapperCode);

    return await new Promise((resolve) => {
      exec(runCommand, { timeout: TIMEOUT_MS }, async (error, stdout, stderr) => {
        // Cleanup
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

        const results = parseResults(stdout, testCases);
        return resolve({ results });
      });
    });

  } catch (err) {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    return { error: 'Execution Service Error: ' + err.message };
  }
}

module.exports = { executeCode };
