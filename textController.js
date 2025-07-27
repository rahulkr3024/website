const textService = require('../services/textService');

async function analyzeText(req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const result = await textService.analyzeText(text);
    res.json(result);
  } catch (error) {
    console.error('Text analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
}

module.exports = { analyzeText };