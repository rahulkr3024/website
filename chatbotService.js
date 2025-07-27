const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');

class ChatbotService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // In-memory storage for chat sessions
    // In production, use a proper database
    this.sessions = new Map();
    this.chatHistory = new Map();
  }

  async startSession(content, title = 'New Chat') {
    try {
      const sessionId = uuidv4();
      const session = {
        id: sessionId,
        title: title,
        content: this.extractText(content),
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messageCount: 0,
        isActive: true
      };
      
      this.sessions.set(sessionId, session);
      this.chatHistory.set(sessionId, []);
      
      // Add initial system message
      const systemMessage = {
        id: uuidv4(),
        role: 'system',
        content: `You are an AI assistant helping users understand and analyze content. The user has provided the following content to discuss:

${session.content}

Please help them with questions, explanations, and insights about this content. Be helpful, accurate, and engaging.`,
        timestamp: new Date().toISOString()
      };
      
      this.chatHistory.get(sessionId).push(systemMessage);
      
      return session;
    } catch (error) {
      console.error('Session start error:', error);
      throw new Error('Failed to start chat session');
    }
  }

  async processMessage(sessionId, message, context = null) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.isActive) {
        throw new Error('Invalid or inactive session');
      }
      
      const history = this.chatHistory.get(sessionId) || [];
      
      // Add user message to history
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        context: context
      };
      
      history.push(userMessage);
      
      // Prepare messages for OpenAI
      const messages = this.prepareMessagesForAI(history);
      
      // Get AI response
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      });
      
      // Add AI response to history
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.choices[0].message.content,
        timestamp: new Date().toISOString(),
        usage: response.usage
      };
      
      history.push(aiMessage);
      
      // Update session
      session.lastActivity = new Date().toISOString();
      session.messageCount += 2; // user + assistant
      
      return {
        message: aiMessage,
        sessionId: sessionId,
        conversationLength: history.length
      };
      
    } catch (error) {
      console.error('Message processing error:', error);
      throw new Error('Failed to process message');
    }
  }

  async askQuestion(content, question, sessionId = null) {
    try {
      const text = this.extractText(content);
      
      const prompt = `Based on the following content, please answer this question: ${question}

Content: ${text}

Please provide a comprehensive and accurate answer based solely on the information provided in the content. If the content doesn't contain enough information to fully answer the question, please indicate what information is missing.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 800
      });

      const answer = {
        id: uuidv4(),
        question: question,
        answer: response.choices[0].message.content,
        timestamp: new Date().toISOString(),
        confidence: this.estimateConfidence(response.choices[0].message.content),
        sessionId: sessionId
      };

      // Add to session history if session exists
      if (sessionId && this.chatHistory.has(sessionId)) {
        const history = this.chatHistory.get(sessionId);
        history.push({
          id: uuidv4(),
          role: 'user',
          content: question,
          timestamp: new Date().toISOString()
        });
        history.push({
          id: uuidv4(),
          role: 'assistant',
          content: answer.answer,
          timestamp: new Date().toISOString()
        });
      }

      return answer;
    } catch (error) {
      console.error('Question answering error:', error);
      throw new Error('Failed to answer question');
    }
  }

  async explainConcept(content, concept, level = 'intermediate') {
    try {
      const text = this.extractText(content);
      
      const levelInstructions = {
        beginner: 'Explain in simple terms, as if to someone new to the topic',
        intermediate: 'Provide a balanced explanation with some technical details',
        advanced: 'Give a detailed, technical explanation for experts'
      };
      
      const prompt = `From the following content, explain the concept "${concept}". ${levelInstructions[level] || levelInstructions.intermediate}.

Content: ${text}

Please provide:
1. A clear definition of the concept
2. How it relates to the content
3. Key points and examples
4. Why it's important in this context`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      return {
        concept: concept,
        level: level,
        explanation: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Concept explanation error:', error);
      throw new Error('Failed to explain concept');
    }
  }

  async suggestQuestions(content, conversationHistory = []) {
    try {
      const text = this.extractText(content);
      const recentMessages = conversationHistory.slice(-10).map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');
      
      const prompt = `Based on the following content and conversation history, suggest 5 thoughtful questions that would help the user better understand the material.

Content: ${text}

Recent conversation:
${recentMessages}

Generate questions that:
1. Explore different aspects of the content
2. Encourage deeper thinking
3. Build on what's already been discussed
4. Are specific and actionable

Format as a JSON array of strings.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 500
      });

      const suggestions = JSON.parse(response.choices[0].message.content);
      
      return {
        questions: suggestions,
        timestamp: new Date().toISOString(),
        basedOnHistory: conversationHistory.length > 0
      };
    } catch (error) {
      console.error('Question suggestion error:', error);
      throw new Error('Failed to suggest questions');
    }
  }

  getChatHistory(sessionId, limit = 50) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const history = this.chatHistory.get(sessionId) || [];
    
    // Filter out system messages and limit results
    const userHistory = history
      .filter(msg => msg.role !== 'system')
      .slice(-limit);
    
    return {
      sessionId: sessionId,
      messages: userHistory,
      totalMessages: userHistory.length,
      session: session
    };
  }

  getUserSessions(userId = 'default') {
    // In a real implementation, filter by userId
    const sessions = Array.from(this.sessions.values())
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    
    return {
      sessions: sessions,
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.isActive).length
    };
  }

  async endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    session.isActive = false;
    session.endTime = new Date().toISOString();
    
    return session;
  }

  getSessionStats(sessionId) {
    const session = this.sessions.get(sessionId);
    const history = this.chatHistory.get(sessionId) || [];
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    const userMessages = history.filter(msg => msg.role === 'user');
    const assistantMessages = history.filter(msg => msg.role === 'assistant');
    
    const duration = session.endTime ? 
      new Date(session.endTime) - new Date(session.startTime) :
      new Date() - new Date(session.startTime);
    
    return {
      sessionId: sessionId,
      title: session.title,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: Math.round(duration / 1000), // seconds
      totalMessages: history.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      averageResponseTime: this.calculateAverageResponseTime(history),
      isActive: session.isActive
    };
  }

  prepareMessagesForAI(history) {
    // Limit context to last 20 messages to stay within token limits
    const recentHistory = history.slice(-20);
    
    return recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  calculateAverageResponseTime(history) {
    const pairs = [];
    for (let i = 0; i < history.length - 1; i++) {
      if (history[i].role === 'user' && history[i + 1].role === 'assistant') {
        const userTime = new Date(history[i].timestamp);
        const assistantTime = new Date(history[i + 1].timestamp);
        pairs.push(assistantTime - userTime);
      }
    }
    
    if (pairs.length === 0) return 0;
    
    const average = pairs.reduce((sum, time) => sum + time, 0) / pairs.length;
    return Math.round(average / 1000); // Convert to seconds
  }

  estimateConfidence(answer) {
    // Simple confidence estimation based on answer characteristics
    const indicators = {
      high: ['clearly', 'definitely', 'specifically states', 'according to the content'],
      medium: ['likely', 'suggests', 'appears to', 'seems to'],
      low: ['might', 'possibly', 'unclear', 'not enough information']
    };
    
    const lowerAnswer = answer.toLowerCase();
    
    if (indicators.high.some(word => lowerAnswer.includes(word))) {
      return 'high';
    } else if (indicators.low.some(word => lowerAnswer.includes(word))) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  extractText(content) {
    if (typeof content === 'string') {
      return content;
    } else if (content.text) {
      return content.text;
    } else if (content.transcript) {
      return content.transcript.text || content.transcript;
    } else if (content.content) {
      return content.content;
    } else {
      return JSON.stringify(content);
    }
  }

  // Cleanup old sessions periodically
  cleanupOldSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [sessionId, session] of this.sessions) {
      const lastActivity = new Date(session.lastActivity);
      if (now - lastActivity > maxAge) {
        this.sessions.delete(sessionId);
        this.chatHistory.delete(sessionId);
        console.log(`🗑 Cleaned up old session: ${sessionId}`);
      }
    }
  }
}

module.exports = new ChatbotService();