const chatbotService = require('../services/chatbotService');

async function askQuestion(req, res) {
  try {
    const { question, context } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const answer = await chatbotService.askAI(question, context);
    res.json({ answer });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
}

module.exports = { askQuestion };