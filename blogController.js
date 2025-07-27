const blogService = require('../services/blogService');

async function analyzeBlog(req, res) {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Blog URL is required' });

    const result = await blogService.analyzeBlog(url);
    res.json(result);
  } catch (error) {
    console.error('Blog analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyze blog' });
  }
}

module.exports = { analyzeBlog };