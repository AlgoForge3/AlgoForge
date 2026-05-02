const { spawn } = require('child_process');
const { generateWrapper } = require('../utils/languageTemplates');

const TIMEOUT_MS = 60000;

/**
 * Split Docker stdout into judge result lines and user-visible stdout.
 */
function splitExecutionOutput(stdout = '') {
  const lines = stdout.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const resultLines = [];
  const userOutputLines = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (userOutputLines.length > 0) {
        userOutputLines.push('');
      }
      return;
    }

    if (/^TC\d+:/.test(trimmed)) {
      resultLines.push(trimmed);
      return;
    }

    userOutputLines.push(line);
  });

  return {
    resultLines,
    stdout: userOutputLines.join('\n').trim(),
  };
}

/**
 * Parse per-testcase results from Docker stdout.
 * Expected line format:  TC0:val1,val2,...
 *
 * Comparison is type-aware using problemMeta.returnType.
 */
function parseResults(resultLines, testCases, returnType) {
  const isVector = /vector|List|int\[\]|long\[\]/.test(returnType || '');
  const isBool   = /bool|boolean/.test(returnType || '');

  return testCases.map((tc, idx) => {
    const marker = `TC${idx}:`;
    const line   = resultLines.find((resultLine) => resultLine.startsWith(marker));

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

function runDockerScript(image, fileName, shellCommand, sourceCode, testCases, returnType) {
  return new Promise((resolve) => {
    const args = [
      'run',
      '--rm',
      '--network=none',
      '-i',
      '-w',
      '/usr/src/app',
      image,
      'sh',
      '-c',
      `cat > ${fileName} && ${shellCommand}`,
    ];

    const child = spawn('docker', args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      finish({ error: error.message });
    });

    child.on('close', (code) => {
      const { resultLines, stdout: userStdout } = splitExecutionOutput(stdout);

      if (timedOut) {
        return finish({ error: 'Time Limit Exceeded (60s)', stdout: userStdout });
      }

      if (code !== 0) {
        return finish({
          error: (stderr || stdout || `Docker exited with code ${code}`).trim(),
          stdout: userStdout,
        });
      }

      return finish({
        results: parseResults(resultLines, testCases, returnType),
        stdout: userStdout,
        stderr: stderr.trim(),
      });
    });

    child.stdin.on('error', () => {});
    child.stdin.end(sourceCode);
  });
}

/**
 * @param {string} language
 * @param {string} userCode
 * @param {object} problemMeta  — { functionName, returnType, parameters }
 * @param {Array}  testCases    — [{ inputs, expected, display }]
 */
async function executeCode(language, userCode, problemMeta, testCases) {
  // Generate the complete source file
  let wrapperCode;
  try {
    wrapperCode = generateWrapper(language, userCode, problemMeta, testCases);
  } catch (e) {
    return { error: e.message };
  }

  let fileName, dockerImage, runCommand;

  switch (language) {
    case 'cpp':
      fileName   = 'script.cpp';
      dockerImage = 'gcc:latest';
      runCommand = 'g++ -O2 script.cpp -o script.out && ./script.out';
      break;
    case 'java':
      fileName   = 'Main.java';
      dockerImage = 'openjdk:17-slim';
      runCommand = 'javac Main.java && java Main';
      break;
    case 'python':
      fileName   = 'script.py';
      dockerImage = 'python:3.9-slim';
      runCommand = 'python script.py';
      break;
    default:
      return { error: `Unsupported language: ${language}` };
  }

  return runDockerScript(dockerImage, fileName, runCommand, wrapperCode, testCases, problemMeta.returnType);
}

module.exports = { executeCode };
