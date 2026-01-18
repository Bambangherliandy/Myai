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

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          // ⬇️ TAMBAHKAN SYSTEM PROMPT DI SINI
          { 
            role: 'system', 
            content: `Kamu adalah BAMBANG AI, asisten virtual yang ramah dan helpful. 
            Kamu selalu menjawab dalam Bahasa Indonesia dengan gaya santai tapi profesional.
            Kamu ahli dalam teknologi, programming, dan membantu menyelesaikan masalah sehari-hari.
            Selalu berikan jawaban yang jelas dan mudah dipahami.`
          },
          { role: 'user', content: question }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

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