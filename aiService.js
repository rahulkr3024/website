const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async generateKeyPoints(content) {
    try {
      const text = this.extractText(content);
      
      const prompt = `Analyze the following content and extract the most important key points. 
      Format as a structured list with clear, concise bullet points:

      Content: ${text}

      Please provide:
      1. Main themes (3-5 key themes)
      2. Important details under each theme
      3. Action items or takeaways (if applicable)
      
      Format the response as JSON with this structure:
      {
        "title": "Content Summary",
        "keyPoints": [
          {
            "theme": "Theme Name",
            "points": ["point 1", "point 2", "point 3"]
          }
        ],
        "takeaways": ["takeaway 1", "takeaway 2"],
        "wordCount": number
      }`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Key points generation error:', error);
      throw new Error('Failed to generate key points');
    }
  }

  async generateDescriptive(content) {
    try {
      const text = this.extractText(content);
      
      const prompt = `Create a comprehensive descriptive analysis of the following content. 
      Provide detailed explanations, context, and insights:

      Content: ${text}

      Please provide:
      1. Executive summary
      2. Detailed analysis with explanations
      3. Context and background information
      4. Insights and implications
      5. Conclusion

      Format as JSON:
      {
        "title": "Descriptive Analysis",
        "executiveSummary": "summary text",
        "sections": [
          {
            "heading": "Section Title",
            "content": "Detailed content"
          }
        ],
        "insights": ["insight 1", "insight 2"],
        "conclusion": "conclusion text"
      }`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 3000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Descriptive generation error:', error);
      throw new Error('Failed to generate descriptive analysis');
    }
  }

  async generateMindmapData(content) {
    try {
      const text = this.extractText(content);
      
      const prompt = `Create a mind map structure from the following content. 
      Organize information hierarchically with a central topic and branching subtopics:

      Content: ${text}

      Format as JSON suitable for mind map visualization:
      {
        "title": "Central Topic",
        "nodes": [
          {
            "id": "1",
            "label": "Main Branch 1",
            "level": 1,
            "children": [
              {
                "id": "1-1",
                "label": "Sub-branch 1.1",
                "level": 2,
                "children": []
              }
            ]
          }
        ],
        "connections": [
          {"from": "root", "to": "1"},
          {"from": "1", "to": "1-1"}
        ]
      }`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 2500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Mind map generation error:', error);
      throw new Error('Failed to generate mind map data');
    }
  }

  async generateShortNotes(content) {
    try {
      const text = this.extractText(content);
      
      const prompt = `Create concise short notes from the following content. 
      Focus on the most essential information in a quick-reference format:

      Content: ${text}

      Format as JSON:
      {
        "title": "Short Notes",
        "notes": [
          {
            "category": "Category Name",
            "items": ["note 1", "note 2", "note 3"]
          }
        ],
        "quickFacts": ["fact 1", "fact 2"],
        "rememberThis": ["key point 1", "key point 2"]
      }`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Short notes generation error:', error);
      throw new Error('Failed to generate short notes');
    }
  }

  async explainTopic(content, question) {
    try {
      const text = this.extractText(content);
      
      const prompt = `Based on the following content, please explain: ${question}

      Content: ${text}

      Provide a clear, comprehensive explanation that addresses the question directly.
      Include relevant examples and context from the content.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      return {
        question,
        explanation: response.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Topic explanation error:', error);
      throw new Error('Failed to explain topic');
    }
  }

  async getTextStatistics(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0);
    
    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(words.length / 200);
    
    // Get most common words (excluding common stop words)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that', 'these', 'those']);
    
    const wordFreq = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });
    
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return {
      wordCount: words.length,
      characterCount: text.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: Math.round(words.length / sentences.length),
      readingTimeMinutes: readingTime,
      topWords,
      complexity: this.calculateReadabilityScore(text, words.length, sentences.length)
    };
  }

  async detectLanguageAndSentiment(text) {
    try {
      const prompt = `Analyze the following text and determine:
      1. The primary language
      2. Overall sentiment (positive, negative, neutral)
      3. Sentiment confidence score (0-1)
      4. Key emotional indicators

      Text: ${text.substring(0, 1000)}...

      Respond in JSON format:
      {
        "language": "language name",
        "languageCode": "ISO code",
        "sentiment": "positive/negative/neutral",
        "sentimentScore": 0.8,
        "emotions": ["emotion1", "emotion2"],
        "confidence": 0.9
      }`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Language detection error:', error);
      throw new Error('Failed to detect language and sentiment');
    }
  }

  async extractEntities(text) {
    try {
      const prompt = `Extract key entities from the following text:
      1. People (names, roles)
      2. Organizations
      3. Locations
      4. Dates/Times
      5. Topics/Concepts
      6. Technologies/Tools

      Text: ${text}

      Respond in JSON format:
      {
        "people": [{"name": "John Doe", "role": "CEO"}],
        "organizations": ["Company ABC", "University XYZ"],
        "locations": ["New York", "California"],
        "dates": ["2024", "January 15"],
        "topics": ["AI", "Machine Learning"],
        "technologies": ["Python", "TensorFlow"]
      }`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Entity extraction error:', error);
      throw new Error('Failed to extract entities');
    }
  }

  async compareTexts(texts, labels = null) {
    try {
      const textComparisons = texts.map((text, index) => 
        `Text ${index + 1}${labels ? ` (${labels[index]})` : ''}: ${text.substring(0, 800)}...`
      ).join('\n\n');

      const prompt = `Compare the following texts and provide:
      1. Similarities between the texts
      2. Key differences
      3. Unique points in each text
      4. Overall comparison summary

      ${textComparisons}

      Respond in JSON format with detailed comparison analysis.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Text comparison error:', error);
      throw new Error('Failed to compare texts');
    }
  }

  async customSummarize(text, length = 'medium') {
    try {
      const lengthInstructions = {
        short: 'in 2-3 sentences',
        medium: 'in 1-2 paragraphs',
        long: 'in 3-4 detailed paragraphs'
      };

      const prompt = `Summarize the following text ${lengthInstructions[length]}:

      ${text}

      Focus on the most important information and maintain the key insights.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: length === 'short' ? 200 : length === 'medium' ? 500 : 800
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Custom summarization error:', error);
      throw new Error('Failed to create custom summary');
    }
  }

  calculateReadabilityScore(text, wordCount, sentenceCount) {
    // Simple Flesch Reading Ease approximation
    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgSyllablesPerWord = this.estimateSyllables(text) / wordCount;
    
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    let level;
    if (score >= 90) level = 'Very Easy';
    else if (score >= 80) level = 'Easy';
    else if (score >= 70) level = 'Fairly Easy';
    else if (score >= 60) level = 'Standard';
    else if (score >= 50) level = 'Fairly Difficult';
    else if (score >= 30) level = 'Difficult';
    else level = 'Very Difficult';

    return {
      score: Math.round(score),
      level,
      avgWordsPerSentence: Math.round(avgWordsPerSentence),
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10
    };
  }

  estimateSyllables(text) {
    // Simple syllable estimation
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    return words.reduce((total, word) => {
      const syllables = word.match(/[aeiouy]+/g) || [];
      return total + Math.max(1, syllables.length);
    }, 0);
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
}

module.exports = new AIService();