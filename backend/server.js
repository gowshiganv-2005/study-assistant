require('dotenv').config();
const express = require('express');
const cors = require('cors');

const chatRoutes = require('./routes/chat');
const modulesRoutes = require('./routes/modules');
const quizRoutes = require('./routes/quiz');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if the origin matches any allowed origin or is a vercel preview/deployment
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: This origin is not allowed access.'), false);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.OPENROUTER_API_KEY && 
                 !process.env.OPENROUTER_API_KEY.includes('your_');
  res.json({ 
    status: 'ok', 
    apiKeyConfigured: hasKey,
    model: process.env.OPENROUTER_MODEL || 'google/gemma-3-4b-it:free',
    provider: 'OpenRouter'
  });
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/generate-modules', modulesRoutes);
app.use('/api/generate-quiz', quizRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Study Assistant Backend running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 Model: ${process.env.OPENROUTER_MODEL || 'google/gemma-3-4b-it:free'}`);

    if (!process.env.OPENROUTER_API_KEY) {
      console.warn('\n⚠️  WARNING: OPENROUTER_API_KEY not set in backend/.env');
    } else {
      console.log('✅ OpenRouter API key loaded');
    }
  });
}

module.exports = app;
