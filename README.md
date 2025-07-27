# Content Analyzer Backend

A comprehensive Node.js backend for analyzing and processing various types of content including videos, blogs, PDFs, and text. The platform provides AI-powered analysis, presentation generation, mindmap creation, and interactive chatbot functionality.

## Features

### Core Analysis Tools
1. *Video URL Summarizer* (YouTube & Instagram)
   - Audio extraction and transcription
   - Visual analysis of video frames
   - Multiple output formats

2. *Blog URL Analyzer*
   - Content extraction from web articles
   - Metadata parsing
   - Bulk analysis support

3. *PDF/eBook Summarizer*
   - Support for PDF, DOCX, and EPUB files
   - Page-specific extraction
   - Chapter detection

4. *Text Analyzer*
   - Direct text input processing
   - Language detection
   - Sentiment analysis

### Output Formats
- *Presentation Slides*: Professional PowerPoint presentations
- *Key Points*: Structured bullet points
- *Descriptive*: Detailed analysis with explanations
- *Mind Maps*: Interactive visual representations
- *Short Notes*: Quick reference summaries
- *Q&A Chatbot*: Interactive discussion about content

### Additional Features
- Multiple download formats (PDF, TXT, DOCX, PPTX)
- Copy-to-clipboard functionality
- Interactive mindmaps with D3.js
- Session-based chatbot
- File cleanup and management

## Prerequisites

- Node.js (v16 or higher)
- NPM or Yarn
- FFmpeg (for video processing)
- API Keys:
  - OpenAI API Key
  - Anthropic API Key (optional)
  - Google API Key (for YouTube)

## Installation

1. *Extract the project files* to your desired directory

2. *Install dependencies*:
   bash
   npm install
   

3. *Install FFmpeg* (required for video processing):
   - *Windows*: Download from https://ffmpeg.org/download.html
   - *macOS*: brew install ffmpeg
   - *Linux*: sudo apt-get install ffmpeg

4. *Create environment file*:
   bash
   cp .env.example .env
   

5. *Configure environment variables* in .env:
   env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Required API Keys
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   GOOGLE_API_KEY=your_google_api_key_here

   # Optional Configuration
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   

## Required API Keys

### 1. OpenAI API Key (Required)
- Visit: https://platform.openai.com/api-keys
- Create an account and generate an API key
- Used for: Content analysis, transcription, and chatbot

### 2. Google API Key (Required for YouTube)
- Visit: https://console.developers.google.com/
- Enable YouTube Data API v3
- Create credentials (API Key)
- Used for: YouTube video information

### 3. Anthropic API Key (Optional)
- Visit: https://console.anthropic.com/
- Create an account and generate an API key
- Used for: Alternative AI model support

## Directory Structure


content-analyzer-backend/
├── server.js                 # Main server file
├── package.json              # Dependencies
├── .env.example              # Environment template
├── README.md                 # This file
├── routes/                   # API routes
│   ├── videoAnalyzer.js
│   ├── blogAnalyzer.js
│   ├── pdfAnalyzer.js
│   ├── textAnalyzer.js
│   ├── presentationGenerator.js
│   ├── mindmapGenerator.js
│   ├── chatbot.js
│   └── downloadManager.js
├── services/                 # Business logic
│   ├── aiService.js
│   ├── videoService.js
│   ├── blogService.js
│   ├── pdfService.js
│   ├── presentationService.js
│   ├── mindmapService.js
│   ├── chatbotService.js
│   └── downloadService.js
├── middleware/               # Request middleware
│   └── validation.js
├── uploads/                  # File uploads (auto-created)
├── downloads/               # Generated files (auto-created)
└── temp/                    # Temporary files (auto-created)


## Running the Application

### Development Mode
bash
npm run dev


### Production Mode
bash
npm start


The server will start on http://localhost:3000 (or your configured PORT).

## API Endpoints

### Video Analysis
- POST /api/video/analyze - Analyze video from URL
- POST /api/video/info - Get video information
- POST /api/video/analyze-instagram - Instagram video analysis

### Blog Analysis
- POST /api/blog/analyze - Analyze blog from URL
- POST /api/blog/metadata - Get blog metadata
- POST /api/blog/bulk-analyze - Analyze multiple blogs

### PDF Analysis
- POST /api/pdf/analyze - Analyze uploaded PDF/DOCX/EPUB
- POST /api/pdf/metadata - Get file metadata
- POST /api/pdf/extract-pages - Extract specific pages

### Text Analysis
- POST /api/text/analyze - Analyze direct text input
- POST /api/text/stats - Get text statistics
- POST /api/text/detect - Language and sentiment detection

### Presentation Generation
- POST /api/presentation/generate - Generate PowerPoint
- POST /api/presentation/generate-custom - Custom presentation
- GET /api/presentation/themes - Available themes

### Mindmap Generation
- POST /api/mindmap/generate - Generate mindmap
- POST /api/mindmap/generate-interactive - Interactive mindmap
- GET /api/mindmap/styles - Available styles

### Chatbot
- POST /api/chat/start - Start chat session
- POST /api/chat/message - Send message
- POST /api/chat/ask - Ask specific question
- GET /api/chat/history/:sessionId - Get chat history

### Downloads
- GET /api/download/presentation/:filename - Download presentation
- GET /api/download/mindmap/:filename - Download mindmap
- POST /api/download/pdf - Generate and download PDF
- POST /api/download/txt - Generate and download TXT

## Testing the API

### Using curl:

bash
# Test video analysis
curl -X POST http://localhost:3000/api/video/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=example", "format": "keypoints"}'

# Test text analysis
curl -X POST http://localhost:3000/api/text/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text content here", "format": "keypoints"}'

# Test blog analysis
curl -X POST http://localhost:3000/api/blog/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/blog-post", "format": "descriptive"}'


### Using Postman:
1. Import the API endpoints
2. Set Content-Type to application/json
3. Add request body with required parameters
4. Test different endpoints

## Deployment

### For Render.com:
1. *Root Directory*: . (project root)
2. *Start Command*: npm start
3. *Environment Variables*: Add all variables from .env file
4. *Runtime*: Node.js

### For Railway/Heroku:
1. *Build Command*: npm install
2. *Start Command*: npm start
3. *Environment Variables*: Configure in platform dashboard

### Environment Variables for Production:
env
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your_production_openai_key
GOOGLE_API_KEY=your_production_google_key
RATE_LIMIT_MAX_REQUESTS=500
ALLOWED_ORIGINS=https://yourdomain.com


## Error Handling

The API returns consistent error responses:

json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}


## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables
- Returns 429 status when exceeded

## File Upload Limits

- Maximum file size: 50MB
- Supported formats: PDF, DOCX, EPUB
- Files are automatically cleaned up after processing

## Security Features

- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- File type validation

## Troubleshooting

### Common Issues:

1. *FFmpeg not found*:
   bash
   # Install FFmpeg
   # Windows: Download from official site
   # macOS: brew install ffmpeg
   # Linux: sudo apt-get install ffmpeg
   

2. *API Key errors*:
   - Verify keys are correctly set in .env
   - Check API key permissions and quotas
   - Ensure keys are active and not expired

3. *File upload errors*:
   - Check file size (max 50MB)
   - Verify file format is supported
   - Ensure uploads directory exists

4. *Port already in use*:
   bash
   # Change PORT in .env file
   PORT=3001
   

5. *Memory issues with large files*:
   - Reduce file sizes
   - Increase Node.js memory limit:
   bash
   node --max-old-space-size=4096 server.js
   

## Support

For issues and questions:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure all required services (FFmpeg) are installed
4. Check API key permissions and quotas

## License

MIT License - See LICENSE file for details