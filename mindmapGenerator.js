const express = require('express');
const router = express.Router();
const mindmapService = require('../services/mindmapService');
const { validateContentRequest } = require('../middleware/validation');

// Generate mindmap from content
router.post('/generate', validateContentRequest, async (req, res) => {
  try {
    const { content, format = 'svg', style = 'tree' } = req.body;
    
    console.log('🧠 Generating mindmap...');
    
    const mindmap = await mindmapService.generateMindmap(content, { format, style });
    
    res.json({
      success: true,
      data: mindmap,
      metadata: {
        format,
        style,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Mindmap generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate mindmap',
      message: error.message
    });
  }
});

// Generate interactive mindmap
router.post('/generate-interactive', validateContentRequest, async (req, res) => {
  try {
    const { content, options = {} } = req.body;
    
    console.log('🧠 Generating interactive mindmap...');
    
    const mindmap = await mindmapService.generateInteractiveMindmap(content, options);
    
    res.json({
      success: true,
      data: mindmap,
      metadata: {
        type: 'interactive',
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Interactive mindmap generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate interactive mindmap',
      message: error.message
    });
  }
});

// Get available mindmap styles
router.get('/styles', (req, res) => {
  const styles = [
    {
      id: 'tree',
      name: 'Tree Structure',
      description: 'Hierarchical tree layout',
      preview: '/assets/previews/tree-style.png'
    },
    {
      id: 'radial',
      name: 'Radial Layout',
      description: 'Central topic with radiating branches',
      preview: '/assets/previews/radial-style.png'
    },
    {
      id: 'flowchart',
      name: 'Flowchart',
      description: 'Process flow diagram',
      preview: '/assets/previews/flowchart-style.png'
    },
    {
      id: 'network',
      name: 'Network Graph',
      description: 'Connected nodes network',
      preview: '/assets/previews/network-style.png'
    }
  ];
  
  res.json({
    success: true,
    data: styles
  });
});

// Export mindmap in different formats
router.post('/export', async (req, res) => {
  try {
    const { mindmapData, format = 'png', options = {} } = req.body;
    
    if (!mindmapData) {
      return res.status(400).json({
        success: false,
        error: 'Mindmap data is required'
      });
    }
    
    const exportedFile = await mindmapService.exportMindmap(mindmapData, format, options);
    
    res.json({
      success: true,
      data: exportedFile,
      metadata: {
        format,
        exportedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Mindmap export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export mindmap',
      message: error.message
    });
  }
});

// Analyze content structure for mindmap preview
router.post('/analyze', validateContentRequest, async (req, res) => {
  try {
    const { content } = req.body;
    
    const analysis = await mindmapService.analyzeContentStructure(content);
    
    res.json({
      success: true,
      data: analysis,
      metadata: {
        analyzedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Content analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content',
      message: error.message
    });
  }
});

module.exports = router;