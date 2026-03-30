const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const templates = require('../utils/languageTemplates');

const TIMEOUT_MS = 5000; // 5 second timeout for code execution

async function executeCode(language, userCode) {
    const uuid = uuidv4();
    const tmpDir = path.resolve(__dirname, '..', 'tmp', uuid);
    
    try {
        await fs.mkdir(tmpDir, { recursive: true });
    } catch (err) {
        return { error: 'Failed to create temp directory' };
    }
    
    let fileName = '';
    let runCommand = '';
    const languageObj = templates[language];
    
    if (!languageObj) {
        return { error: 'Unsupported language' };
    }
    
    const wrapperCode = languageObj.wrapper(userCode);
    
    // Use quotes around tmpDir to prevent path issues with spaces on Windows
    const dockerMountPath = `"${tmpDir}:/usr/src/app"`;
    
    switch (language) {
        case 'cpp':
            fileName = 'script.cpp';
            runCommand = `docker run --rm -v ${dockerMountPath} -w /usr/src/app gcc:latest sh -c "g++ -O2 script.cpp -o script.out && ./script.out"`;
            break;
        case 'java':
            fileName = 'Main.java';
            runCommand = `docker run --rm -v ${dockerMountPath} -w /usr/src/app openjdk:latest sh -c "javac Main.java && java Main"`;
            break;
        case 'python':
            fileName = 'script.py';
            runCommand = `docker run --rm -v ${dockerMountPath} -w /usr/src/app python:3.9-slim sh -c "python script.py"`;
            break;
    }
    
    const filePath = path.join(tmpDir, fileName);
    
    try {
        await fs.writeFile(filePath, wrapperCode);
        
        return await new Promise((resolve) => {
            exec(runCommand, { timeout: TIMEOUT_MS }, async (error, stdout, stderr) => {
                // Cleanup temp dir
                try {
                    await fs.rm(tmpDir, { recursive: true, force: true });
                } catch(e) { /* ignore cleanup error */ }

                if (error) {
                    if (error.signal === 'SIGTERM' || error.killed) {
                        return resolve({ error: 'Execution Timed Out' });
                    }
                    return resolve({ error: stderr || stdout || error.message });
                }
                
                if (stderr) {
                    return resolve({ error: stderr });
                }
                
                return resolve({ output: stdout.trim() });
            });
        });
        
    } catch (err) {
        // Cleanup if error occurred during file write or exec spawn
        try {
            await fs.rm(tmpDir, { recursive: true, force: true });
        } catch(e) { }
        return { error: 'Execution Service Error: ' + err.message };
    }
}

module.exports = { executeCode };
