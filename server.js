const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static('uploads'));
app.use('/downloads', express.static('downloads'));

// ✅ Routes (Make sure all these files export a proper router)
app.use('/api/video', require('./routes/videoAnalyzer'));
app.use('/api/blog', require('./routes/blogAnalyzer'));
app.use('/api/pdf', require('./routes/pdfAnalyzer'));
app.use('/api/text', require('./routes/textAnalyzer'));
app.use('/api/presentation', require('./routes/presentationGenerator'));
app.use('/api/mindmap', require('./routes/mindmapGenerator'));
app.use('/api/chat', require('./routes/chatbot'));
app.use('/api/download', require('./routes/downloadManager'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Content Analyzer Backend API',
    version: '1.0.0',
    endpoints: {
      video: '/api/video',
      blog: '/api/blog',
      pdf: '/api/pdf',
      text: '/api/text',
      presentation: '/api/presentation',
      mindmap: '/api/mindmap',
      chat: '/api/chat',
      download: '/api/download'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
});