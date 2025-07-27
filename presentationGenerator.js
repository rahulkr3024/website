const express = require('express');
const router = express.Router();
const presentationService = require('../services/presentationService');
const { validatePresentationRequest } = require('../middleware/validation');

// Generate presentation from content
router.post('/generate', validatePresentationRequest, async (req, res) => {
  try {
    const { content, options = {} } = req.body;
    
    console.log('🎨 Generating presentation...');
    
    const presentation = await presentationService.generatePresentation(content);
    
    res.json({
      success: true,
      data: presentation,
      message: 'Presentation generated successfully'
    });
    
  } catch (error) {
    console.error('Presentation generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate presentation',
      message: error.message
    });
  }
});

// Generate custom presentation with options
router.post('/generate-custom', validatePresentationRequest, async (req, res) => {
  try {
    const { content, options = {} } = req.body;
    
    console.log('🎨 Generating custom presentation...');
    
    const presentation = await presentationService.generateCustomPresentation(content, options);
    
    res.json({
      success: true,
      data: presentation,
      message: 'Custom presentation generated successfully'
    });
    
  } catch (error) {
    console.error('Custom presentation generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom presentation',
      message: error.message
    });
  }
});

// Get available themes
router.get('/themes', (req, res) => {
  const themes = [
    {
      id: 'professional',
      name: 'Professional',
      description: 'Clean and corporate design',
      colors: ['#2E4BC6', '#4DABF7', '#FF6B6B']
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Contemporary and sleek design',
      colors: ['#1A1A1A', '#6C63FF', '#FF6B9D']
    },
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Traditional business style',
      colors: ['#003366', '#0066CC', '#FF9900']
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Vibrant and artistic design',
      colors: ['#E91E63', '#9C27B0', '#FF5722']
    }
  ];
  
  res.json({
    success: true,
    data: themes
  });
});

// Preview presentation structure
router.post('/preview', validatePresentationRequest, async (req, res) => {
  try {
    const { content, options = {} } = req.body;
    
    // Analyze content and return slide structure without generating actual file
    const slideStructure = await presentationService.analyzeContentForSlides(content);
    
    res.json({
      success: true,
      data: {
        title: slideStructure.title,
        slideCount: slideStructure.slides.length + 2,
        slides: slideStructure.slides.map(slide => ({
          title: slide.title,
          type: slide.type,
          pointCount: slide.content.points ? slide.content.points.length : 0
        })),
        conclusion: slideStructure.conclusion
      }
    });
    
  } catch (error) {
    console.error('Presentation preview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate presentation preview',
      message: error.message
    });
  }
});

module.exports = router;