const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const pdfService = require('../services/pdfService');
const aiService = require('../services/aiService');
const presentationService = require('../services/presentationService');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/epub+zip') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and EPUB files are allowed'));
    }
  }
});

// Analyze PDF/eBook file
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const { format = 'keypoints' } = req.body;
    const filePath = req.file.path;
    
    console.log(`📄 Processing file: ${req.file.originalname}`);
    
    // Extract text content based on file type
    let content;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    switch (fileExtension) {
      case '.pdf':
        content = await pdfService.extractPDFContent(filePath);
        break;
      case '.docx':
        content = await pdfService.extractDocxContent(filePath);
        break;
      case '.epub':
        content = await pdfService.extractEpubContent(filePath);
        break;
      default:
        throw new Error('Unsupported file format');
    }
    
    // Generate analysis based on format
    let result;
    switch (format) {
      case 'presentation':
        result = await presentationService.generatePresentation(content);
        break;
      case 'keypoints':
        result = await aiService.generateKeyPoints(content);
        break;
      case 'descriptive':
        result = await aiService.generateDescriptive(content);
        break;
      case 'mindmap':
        result = await aiService.generateMindmapData(content);
        break;
      case 'shortnotes':
        result = await aiService.generateShortNotes(content);
        break;
      default:
        result = await aiService.generateKeyPoints(content);
    }
    
    res.json({
      success: true,
      data: result,
      metadata: {
        filename: req.file.originalname,
        format,
        fileSize: req.file.size,
        pages: content.pageCount,
        wordCount: content.wordCount,
        processedAt: new Date().toISOString()
      }
    });
    
    // Clean up uploaded file
    setTimeout(() => {
      pdfService.cleanupFile(filePath);
    }, 60000); // Delete after 1 minute
    
  } catch (error) {
    console.error('PDF analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze file',
      message: error.message
    });
    
    // Clean up on error
    if (req.file) {
      pdfService.cleanupFile(req.file.path);
    }
  }
});

// Get file metadata without processing
router.post('/metadata', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let metadata;
    switch (fileExtension) {
      case '.pdf':
        metadata = await pdfService.getPDFMetadata(filePath);
        break;
      case '.docx':
        metadata = await pdfService.getDocxMetadata(filePath);
        break;
      case '.epub':
        metadata = await pdfService.getEpubMetadata(filePath);
        break;
      default:
        throw new Error('Unsupported file format');
    }
    
    res.json({
      success: true,
      data: metadata
    });
    
    // Clean up uploaded file
    pdfService.cleanupFile(filePath);
    
  } catch (error) {
    console.error('File metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file metadata',
      message: error.message
    });
    
    if (req.file) {
      pdfService.cleanupFile(req.file.path);
    }
  }
});

// Extract specific pages from PDF
router.post('/extract-pages', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const { startPage, endPage, format = 'keypoints' } = req.body;
    const filePath = req.file.path;
    
    if (path.extname(req.file.originalname).toLowerCase() !== '.pdf') {
      return res.status(400).json({
        success: false,
        error: 'Page extraction only supported for PDF files'
      });
    }
    
    const content = await pdfService.extractPDFPages(filePath, startPage, endPage);
    
    let result;
    switch (format) {
      case 'presentation':
        result = await presentationService.generatePresentation(content);
        break;
      case 'keypoints':
        result = await aiService.generateKeyPoints(content);
        break;
      case 'descriptive':
        result = await aiService.generateDescriptive(content);
        break;
      case 'mindmap':
        result = await aiService.generateMindmapData(content);
        break;
      case 'shortnotes':
        result = await aiService.generateShortNotes(content);
        break;
      default:
        result = await aiService.generateKeyPoints(content);
    }
    
    res.json({
      success: true,
      data: result,
      metadata: {
        filename: req.file.originalname,
        format,
        extractedPages: `${startPage}-${endPage}`,
        processedAt: new Date().toISOString()
      }
    });
    
    // Clean up uploaded file
    pdfService.cleanupFile(filePath);
    
  } catch (error) {
    console.error('Page extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract pages',
      message: error.message
    });
    
    if (req.file) {
      pdfService.cleanupFile(req.file.path);
    }
  }
});

module.exports = router;