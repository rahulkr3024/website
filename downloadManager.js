const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const downloadService = require('../services/downloadService');

// Download presentation files
router.get('/presentation/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../downloads', filename);
    
    // Validate file exists and is safe
    await downloadService.validateDownload(filePath, 'presentation');
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({
          success: false,
          error: 'Download failed'
        });
      }
    });
    
  } catch (error) {
    console.error('Presentation download error:', error);
    res.status(404).json({
      success: false,
      error: 'File not found',
      message: error.message
    });
  }
});

// Download mindmap files
router.get('/mindmap/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../downloads', filename);
    
    await downloadService.validateDownload(filePath, 'mindmap');
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({
          success: false,
          error: 'Download failed'
        });
      }
    });
    
  } catch (error) {
    console.error('Mindmap download error:', error);
    res.status(404).json({
      success: false,
      error: 'File not found',
      message: error.message
    });
  }
});

// Generate and download content as PDF
router.post('/pdf', async (req, res) => {
  try {
    const { content, title = 'Content Analysis', format = 'A4' } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const pdfFile = await downloadService.generatePDF(content, title, format);
    
    res.download(pdfFile.filepath, pdfFile.filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({
          success: false,
          error: 'PDF download failed'
        });
      }
      
      // Clean up file after download
      setTimeout(() => {
        downloadService.cleanupFile(pdfFile.filepath);
      }, 60000);
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
});

// Generate and download content as TXT
router.post('/txt', async (req, res) => {
  try {
    const { content, title = 'Content Analysis', format = 'keypoints' } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const txtFile = await downloadService.generateTXT(content, title, format);
    
    res.download(txtFile.filepath, txtFile.filename, (err) => {
      if (err) {
        console.error('TXT download error:', err);
        res.status(500).json({
          success: false,
          error: 'TXT download failed'
        });
      }
      
      // Clean up file after download
      setTimeout(() => {
        downloadService.cleanupFile(txtFile.filepath);
      }, 60000);
    });
    
  } catch (error) {
    console.error('TXT generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate TXT',
      message: error.message
    });
  }
});

// Generate and download content as DOCX
router.post('/docx', async (req, res) => {
  try {
    const { content, title = 'Content Analysis', format = 'descriptive' } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const docxFile = await downloadService.generateDOCX(content, title, format);
    
    res.download(docxFile.filepath, docxFile.filename, (err) => {
      if (err) {
        console.error('DOCX download error:', err);
        res.status(500).json({
          success: false,
          error: 'DOCX download failed'
        });
      }
      
      // Clean up file after download
      setTimeout(() => {
        downloadService.cleanupFile(docxFile.filepath);
      }, 60000);
    });
    
  } catch (error) {
    console.error('DOCX generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate DOCX',
      message: error.message
    });
  }
});

// Get copy-ready content
router.post('/copy', async (req, res) => {
  try {
    const { content, format = 'keypoints' } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const copyText = await downloadService.generateCopyText(content, format);
    
    res.json({
      success: true,
      data: {
        text: copyText,
        format: format,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Copy text generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate copy text',
      message: error.message
    });
  }
});

// Get download history
router.get('/history', async (req, res) => {
  try {
    const { limit = 20, type } = req.query;
    
    const history = await downloadService.getDownloadHistory(parseInt(limit), type);
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    console.error('Download history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get download history',
      message: error.message
    });
  }
});

// Get available download formats
router.get('/formats', (req, res) => {
  const formats = [
    {
      type: 'pdf',
      name: 'PDF Document',
      description: 'Portable Document Format for universal viewing',
      mimeType: 'application/pdf',
      extension: '.pdf'
    },
    {
      type: 'txt',
      name: 'Text File',
      description: 'Plain text format for simple viewing and editing',
      mimeType: 'text/plain',
      extension: '.txt'
    },
    {
      type: 'docx',
      name: 'Word Document',
      description: 'Microsoft Word format for advanced editing',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: '.docx'
    },
    {
      type: 'pptx',
      name: 'PowerPoint Presentation',
      description: 'Microsoft PowerPoint format for presentations',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      extension: '.pptx'
    },
    {
      type: 'copy',
      name: 'Copy to Clipboard',
      description: 'Get formatted text ready for copying',
      mimeType: 'text/plain',
      extension: null
    }
  ];
  
  res.json({
    success: true,
    data: formats
  });
});

// Clean up old download files
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge = 24 } = req.body; // hours
    
    const result = await downloadService.cleanupOldFiles(maxAge);
    
    res.json({
      success: true,
      data: result,
      message: 'Cleanup completed successfully'
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

module.exports = router;