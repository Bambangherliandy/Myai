const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Setup multer untuk upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Max 10MB
});

// Endpoint untuk chat biasa
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
        messages: [
          { 
            role: 'system', 
            content: 'Kamu adalah BAMBANG AI, asisten virtual yang ramah dan helpful. Kamu selalu menjawab dalam Bahasa Indonesia dengan gaya santai tapi profesional.'
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

// Endpoint untuk upload dan analisis file
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { question } = req.body;
    const filePath = req.file.path;
    const fileType = req.file.mimetype;

    console.log('File uploaded:', req.file.originalname);
    console.log('File type:', fileType);

    // Baca file sebagai base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64File = fileBuffer.toString('base64');

    let messages = [
      { 
        role: 'system', 
        content: 'Kamu adalah BAMBANG AI yang bisa menganalisis file. Jelaskan isi file dengan detail dan jawab pertanyaan user tentang file tersebut.'
      }
    ];

    // Untuk gambar
    if (fileType.startsWith('image/')) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: question || 'Jelaskan apa yang ada di gambar ini secara detail.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${fileType};base64,${base64File}`
            }
          }
        ]
      });
    } 
    // Untuk text/dokumen (perlu library tambahan untuk parse PDF)
    else {
      // Untuk file text biasa
      const textContent = fileBuffer.toString('utf-8');
      messages.push({
        role: 'user',
        content: `File: ${req.file.originalname}\n\nIsi file:\n${textContent}\n\nPertanyaan: ${question || 'Ringkas isi file ini.'}`
      });
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.2-90b-vision-preview', // Model dengan vision capability
        messages: messages,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Hapus file setelah diproses (opsional)
    fs.unlinkSync(filePath);

    res.json({
      answer: response.data.choices[0].message.content,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.json({
      answer: 'Error memproses file: ' + error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Groq API Key loaded: ${GROQ_API_KEY ? 'Yes' : 'No'}`);
});