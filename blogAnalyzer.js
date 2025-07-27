const express = require('express');
const router = express.Router();
const BlogService = require('../services/blogService');
const aiService = require('../services/aiService');
const presentationService = require('../services/presentationService');
const { validateBlogURL } = require('../middleware/validation');

const blogService = new BlogService();

// Analyze blog from URL
router.post('/analyze', validateBlogURL, async (req, res) => {
  try {
    const { url, format = 'keypoints' } = req.body;
    
    console.log(`📰 Processing blog: ${url}`);
    
    // Extract blog content
    const blogContent = await blogService.extractContent(url);
    
    // Generate analysis based on format
    let result;
    switch (format) {
      case 'presentation':
        result = await presentationService.generatePresentation(blogContent);
        break;
      case 'keypoints':
        result = await aiService.generateKeyPoints(blogContent);
        break;
      case 'descriptive':
        result = await aiService.generateDescriptive(blogContent);
        break;
      case 'mindmap':
        result = await aiService.generateMindmapData(blogContent);
        break;
      case 'shortnotes':
        result = await aiService.generateShortNotes(blogContent);
        break;
      default:
        result = await aiService.generateKeyPoints(blogContent);
    }
    
    res.json({
      success: true,
      data: result,
      metadata: {
        url,
        format,
        title: blogContent.title,
        author: blogContent.author,
        wordCount: blogContent.wordCount,
        estimatedReadTime: blogContent.estimatedReadTime,
        processedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Blog analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze blog',
      message: error.message
    });
  }
});

// Get blog metadata without processing
router.post('/metadata', validateBlogURL, async (req, res) => {
  try {
    const { url } = req.body;
    const metadata = await blogService.extractContent(url);
    
    // Return only metadata without AI processing
    res.json({
      success: true,
      data: {
        title: metadata.title,
        author: metadata.author,
        publishDate: metadata.publishDate,
        modifiedDate: metadata.modifiedDate,
        excerpt: metadata.excerpt,
        keywords: metadata.keywords,
        image: metadata.image,
        wordCount: metadata.wordCount,
        characterCount: metadata.characterCount,
        estimatedReadTime: metadata.estimatedReadTime,
        url: metadata.url,
        extractedAt: metadata.extractedAt
      }
    });
    
  } catch (error) {
    console.error('Blog metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract blog metadata',
      message: error.message
    });
  }
});

// Get blog content summary
router.post('/summary', validateBlogURL, async (req, res) => {
  try {
    const { url, length = 'medium' } = req.body; // short, medium, long
    
    const blogContent = await blogService.extractContent(url);
    const summary = await aiService.customSummarize(blogContent.content, length);
    
    res.json({
      success: true,
      data: {
        summary,
        originalTitle: blogContent.title,
        originalWordCount: blogContent.wordCount,
        summaryWordCount: summary.split(/\s+/).length,
        compressionRatio: (summary.split(/\s+/).length / blogContent.wordCount * 100).toFixed(2) + '%'
      },
      metadata: {
        url,
        length,
        processedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Blog summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to summarize blog',
      message: error.message
    });
  }
});

// Extract key topics and entities from blog
router.post('/topics', validateBlogURL, async (req, res) => {
  try {
    const { url } = req.body;
    
    const blogContent = await blogService.extractContent(url);
    const topics = await aiService.extractEntities(blogContent.content);
    
    res.json({
      success: true,
      data: topics,
      metadata: {
        url,
        title: blogContent.title,
        processedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Blog topics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract topics',
      message: error.message
    });
  }
});

// Analyze blog sentiment and language
router.post('/sentiment', validateBlogURL, async (req, res) => {
  try {
    const { url } = req.body;
    
    const blogContent = await blogService.extractContent(url);
    const analysis = await aiService.detectLanguageAndSentiment(blogContent.content);
    
    res.json({
      success: true,
      data: analysis,
      metadata: {
        url,
        title: blogContent.title,
        processedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Blog sentiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment',
      message: error.message
    });
  }
});

module.exports = router;