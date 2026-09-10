const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
  try {
    const { language, code, stdin } = req.body;


    const response = await axios.post(
      `http://localhost:6000/execute`,
      { language, code, stdin },
      { timeout: 15000 } 
    );

    res.json(response.data);

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Execution service unavailable'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Execution failed'
    });
  }
});

module.exports = router;