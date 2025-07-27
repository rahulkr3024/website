const presentationService = require('../services/presentationService');

async function generatePresentation(req, res) {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required for presentation' });

    const pptPath = await presentationService.createPresentation(content);
    res.download(pptPath); // Assumes file was saved locally
  } catch (error) {
    console.error('Presentation generation error:', error);
    res.status(500).json({ error: 'Failed to generate presentation' });
  }
}

module.exports = { generatePresentation };