require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runCode } = require('./runner');

const app = express();

app.use(cors());
app.use(express.json());


app.get('/health', (req, res) => {
  res.json({ status: 'Executor running' });
});


app.post('/execute', async (req, res) => {
  const { language, code, stdin } = req.body;

  if (!language || !code) {
    return res.status(400).json({
      success: false,
      error: 'language and code are required'
    });
  }


  if (code.length > 50000) {
    return res.status(400).json({
      success: false,
      error: 'Code too long (max 50,000 characters)'
    });
  }

  console.log(`Executing ${language} code...`);

  const result = await runCode(language, code, stdin);

  console.log(`Execution complete in ${result.executionTime}ms`);

  res.json(result);
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Executor service running on port ${PORT}`);
});