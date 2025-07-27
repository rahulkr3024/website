const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbotService');
const { validateChatRequest } = require('../middleware/validation');

// Start new chat session
router.post('/start', async (req, res) => {
  try {
    const { content, title = 'New Chat' } = req.body;
    
    const session = await chatbotService.startSession(content, title);
    
    res.json({
      success: true,
      data: session,
      message: 'Chat session started successfully'
    });
    
  } catch (error) {
    console.error('Chat session start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start chat session',
      message: error.message
    });
  }
});

// Send message to chatbot
router.post('/message', validateChatRequest, async (req, res) => {
  try {
    const { sessionId, message, context } = req.body;
    
    console.log(`💬 Processing chat message for session: ${sessionId}`);
    
    const response = await chatbotService.processMessage(sessionId, message, context);
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      message: error.message
    });
  }
});

// Get chat history
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;
    
    const history = await chatbotService.getChatHistory(sessionId, parseInt(limit));
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history',
      message: error.message
    });
  }
});

// Get all chat sessions for a user
router.get('/sessions', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const sessions = await chatbotService.getUserSessions(userId);
    
    res.json({
      success: true,
      data: sessions
    });
    
  } catch (error) {
    console.error('Chat sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat sessions',
      message: error.message
    });
  }
});

// Ask question about specific content
router.post('/ask', async (req, res) => {
  try {
    const { content, question, sessionId } = req.body;
    
    if (!question || !content) {
      return res.status(400).json({
        success: false,
        error: 'Content and question are required'
      });
    }
    
    const answer = await chatbotService.askQuestion(content, question, sessionId);
    
    res.json({
      success: true,
      data: answer
    });
    
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to answer question',
      message: error.message
    });
  }
});

// Generate follow-up questions
router.post('/suggest-questions', async (req, res) => {
  try {
    const { content, conversationHistory = [] } = req.body;
    
    const suggestions = await chatbotService.suggestQuestions(content, conversationHistory);
    
    res.json({
      success: true,
      data: suggestions
    });
    
  } catch (error) {
    console.error('Question suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest questions',
      message: error.message
    });
  }
});

// Explain concept from content
router.post('/explain', async (req, res) => {
  try {
    const { content, concept, level = 'intermediate' } = req.body;
    
    if (!concept || !content) {
      return res.status(400).json({
        success: false,
        error: 'Content and concept are required'
      });
    }
    
    const explanation = await chatbotService.explainConcept(content, concept, level);
    
    res.json({
      success: true,
      data: explanation
    });
    
  } catch (error) {
    console.error('Concept explanation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to explain concept',
      message: error.message
    });
  }
});

// End chat session
router.post('/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await chatbotService.endSession(sessionId);
    
    res.json({
      success: true,
      message: 'Chat session ended successfully'
    });
    
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
      message: error.message
    });
  }
});

// Get session statistics
router.get('/stats/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const stats = await chatbotService.getSessionStats(sessionId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Session stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session statistics',
      message: error.message
    });
  }
});

module.exports = router;