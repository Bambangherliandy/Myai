const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Serve static files dari folder public
app.use(express.static('public'));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Endpoint /ask
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        answer: 'Pertanyaan tidak boleh kosong'
      });
    }

    console.log('Sending request to Groq...');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: question }]
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response received from Groq');

    res.json({
      answer: response.data.choices[0].message.content
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.json({
      answer: 'Error: ' + error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Buka browser: http://localhost:${PORT}`);
  console.log(`✅ Groq API Key loaded: ${GROQ_API_KEY ? 'Yes' : 'No'}`);
});