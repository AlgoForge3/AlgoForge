const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { executeCode } = require('./services/dockerService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.post('/api/execute', async (req, res) => {
    const { language, code } = req.body;
    
    if (!language || !code) {
        return res.status(400).json({ error: 'Language and code are required fields' });
    }
    
    try {
        const result = await executeCode(language, code);
        
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        
        return res.json({ output: result.output });

    } catch (err) {
        console.error('Execution error:', err);
        return res.status(500).json({ error: 'Internal server error during execution' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
