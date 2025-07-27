const videoService = require('../services/videoService');

async function analyzeVideo(req, res) {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Video URL is required' });

    const result = await videoService.analyzeVideo(url);
    res.json(result);
  } catch (error) {
    console.error('Video analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyze video' });
  }
}

module.exports = { analyzeVideo };