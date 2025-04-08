require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 5001;

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Test route for POST without OpenAI
app.post('/api/test', (req, res) => {
  console.log('POST test received:', req.body);
  res.json({ message: 'POST test successful', body: req.body });
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/chat', async (req, res) => {
  try {
    console.log('POST /api/chat received:', req.body);
    const { message, voice = 'nova' } = req.body; // Default to nova voice
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", content: `You are a helpful and engaging English language tutor. Your students are adult learners or young adults who want to improve their English skills, especially listening, vocabulary, and speaking fluency.

Your tone is friendly, encouraging, and easy to understand.

Each lesson or response should include:

Real-life context or situation (e.g., ordering food, small talk, job interview)

Key vocabulary with simple definitions and example sentences

Listening or speaking practice tips

Short quizzes or interactive questions when appropriate

Avoid using too many technical grammar terms. Use clear and practical English. Encourage learners to repeat, speak aloud, and use words in their own sentences.

Your goal is to make learners feel confident and excited to use English every day` },
        { role: "user", content: message }
      ],
    });

    const response = completion.choices[0].message.content;
    console.log('OpenAI response received');

    // Generate speech from the response with HD model
    const speechResponse = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: voice, // Use the requested voice or default
      input: response,
    });

    // Convert the audio to base64
    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    res.json({ 
      response,
      audioContent: audioBase64,
      voice // Return which voice was used
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ 
      error: 'Something went wrong',
      details: error.message 
    });
  }
});

// Get available voices
app.get('/api/voices', (req, res) => {
  const voices = [
    { id: 'alloy', description: 'Balanced and clear' },
    { id: 'echo', description: 'Mature and deep' },
    { id: 'fable', description: 'Warm and friendly' },
    { id: 'onyx', description: 'Strong and powerful' },
    { id: 'nova', description: 'Professional female' },
    { id: 'shimmer', description: 'Young and bright' }
  ];
  res.json(voices);
});

// Error handling middleware should be last
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Something went wrong!',
    details: err.message
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Test the server with: curl http://localhost:${port}`);
}); 