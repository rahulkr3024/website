const pdfService = require('../services/pdfService');

async function analyzePDF(req, res) {
  try {
    const pdfFile = req.file;
    if (!pdfFile) return res.status(400).json({ error: 'PDF file is required' });

    const result = await pdfService.analyzePDF(pdfFile);
    res.json(result);
  } catch (error) {
    console.error('PDF analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyze PDF' });
  }
}

module.exports = { analyzePDF };