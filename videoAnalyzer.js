const express = require('express');
const router = express.Router();
const videoService = require('../services/videoService');
const aiService = require('../services/aiService');
const presentationService = require('../services/presentationService');
const { validateVideoURL } = require('../middleware/validation');

// Analyze video from URL
router.post('/analyze', validateVideoURL, async (req, res) => {
  try {
    const { url, format = 'keypoints' } = req.body;
    
    console.log(`📹 Processing video: ${url}`);
    
    // Extract audio and get transcript
    const audioPath = await videoService.extractAudio(url);
    const transcript = await videoService.transcribeAudio(audioPath);
    
    // Get visual analysis
    const visualAnalysis = await videoService.analyzeVisuals(url);
    
    // Combine transcript and visual analysis
    const combinedContent = {
      transcript,
      visualNotes: visualAnalysis,
      url
    };
    
    // Generate analysis based on format
    let result;
    switch (format) {
      case 'presentation':
        result = await presentationService.generatePresentation(combinedContent);
        break;
      case 'keypoints':
        result = await aiService.generateKeyPoints(combinedContent);
        break;
      case 'descriptive':
        result = await aiService.generateDescriptive(combinedContent);
        break;
      case 'mindmap':
        result = await aiService.generateMindmapData(combinedContent);
        break;
      case 'shortnotes':
        result = await aiService.generateShortNotes(combinedContent);
        break;
      default:
        result = await aiService.generateKeyPoints(combinedContent);
    }
    
    res.json({
      success: true,
      data: result,
      metadata: {
        url,
        format,
        duration: transcript.duration,
        processedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Video analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze video',
      message: error.message
    });
  }
});

// Get video info without processing
router.post('/info', validateVideoURL, async (req, res) => {
  try {
    const { url } = req.body;
    const info = await videoService.getVideoInfo(url);
    
    res.json({
      success: true,
      data: info
    });
    
  } catch (error) {
    console.error('Video info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get video info',
      message: error.message
    });
  }
});

// Support for Instagram videos
router.post('/analyze-instagram', async (req, res) => {
  try {
    const { url, format = 'keypoints' } = req.body;
    
    // Instagram video processing (similar to YouTube but different extraction method)
    const result = await videoService.processInstagramVideo(url, format);
    
    res.json({
      success: true,
      data: result,
      metadata: {
        url,
        format,
        platform: 'instagram',
        processedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Instagram video analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze Instagram video',
      message: error.message
    });
  }
});

module.exports = router;