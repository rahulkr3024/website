// services/textService.js

const aiService = require('./aiService');

async function analyzeText(text) {
  try {
    const cleanedText = text.trim();

    // Generate different output formats using AI
    const keyPoints = await aiService.generateKeyPoints(cleanedText);
    const summary = await aiService.generateSummary(cleanedText);
    const shortNotes = await aiService.generateShortNotes(cleanedText);
    const mindmapData = await aiService.generateMindmap(cleanedText);
    const pptSlides = await aiService.generatePresentation(cleanedText);
    const qna = await aiService.generateQnA(cleanedText);
    const explanation = await aiService.generateExplanation(cleanedText);

    return {
      keyPoints,
      summary,
      shortNotes,
      mindmap: mindmapData,
      presentation: pptSlides,
      qna,
      explanation
    };
  } catch (error) {
    console.error("Error in analyzeText:", error);
    throw new Error("Failed to analyze text");
  }
}

module.exports = {
  analyzeText
};