const mindmapService = require('../services/mindmapService');

async function generateMindmap(req, res) {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required for mindmap' });

    const imagePath = await mindmapService.createMindmap(content);
    res.json({ imageUrl: imagePath }); // Or res.download(imagePath) if serving as file
  } catch (error) {
    console.error('Mindmap generation error:', error);
    res.status(500).json({ error: 'Failed to generate mindmap' });
  }
}

module.exports = { generateMindmap };