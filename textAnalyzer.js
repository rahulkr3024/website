const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const presentationService = require('../services/presentationService');
const { validateTextInput } = require('../middleware/validation');

// Analyze direct text input
router.post('/analyze', validateTextInput, async (req, res) => {
  try {
    const { text, format = 'keypoints', title = 'Text Analysis' } = req.body;
    
    console.log(`📝 Processing text: ${text.substring(0, 100)}...`);
    
    const content = {
      text,
      title,
      wordCount: text.split(/\s+/).length,
      characterCount: text.length
    };
    
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
        format,
        title,
        wordCount: content.wordCount,
        characterCount: content.characterCount,
        processedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze text',
      message: error.message
    });
  }
});

// Get text statistics
router.post('/stats', validateTextInput, async (req, res) => {
  try {
    const { text } = req.body;
    
    const stats = await aiService.getTextStatistics(text);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Text stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get text statistics',
      message: error.message
    });
  }
});

// Detect language and sentiment
router.post('/detect', validateTextInput, async (req, res) => {
  try {
    const { text } = req.body;
    
    const detection = await aiService.detectLanguageAndSentiment(text);
    
    res.json({
      success: true,
      data: detection
    });
    
  } catch (error) {
    console.error('Text detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect language and sentiment',
      message: error.message
    });
  }
});

// Extract key entities and topics
router.post('/entities', validateTextInput, async (req, res) => {
  try {
    const { text } = req.body;
    
    const entities = await aiService.extractEntities(text);
    
    res.json({
      success: true,
      data: entities
    });
    
  } catch (error) {
    console.error('Entity extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract entities',
      message: error.message
    });
  }
});

// Compare multiple texts
router.post('/compare', async (req, res) => {
  try {
    const { texts, labels } = req.body;
    
    if (!Array.isArray(texts) || texts.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least two texts are required for comparison'
      });
    }
    
    const comparison = await aiService.compareTexts(texts, labels);
    
    res.json({
      success: true,
      data: comparison
    });
    
  } catch (error) {
    console.error('Text comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare texts',
      message: error.message
    });
  }
});

// Summarize with custom length
router.post('/summarize', validateTextInput, async (req, res) => {
  try {
    const { text, length = 'medium' } = req.body; // short, medium, long
    
    const summary = await aiService.customSummarize(text, length);
    
    res.json({
      success: true,
      data: summary,
      metadata: {
        originalLength: text.split(/\s+/).length,
        summaryLength: summary.split(/\s+/).length,
        compressionRatio: (summary.split(/\s+/).length / text.split(/\s+/).length * 100).toFixed(2) + '%'
      }
    });
    
  } catch (error) {
    console.error('Text summarization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to summarize text',
      message: error.message
    });
  }
});

module.exports = router;