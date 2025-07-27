// Export all services for easy importing
const aiService = require('./aiService');
const textService = require('./textService');
const videoService = require('./videoService');
const BlogService = require('./blogService');
const pdfService = require('./pdfService');
const presentationService = require('./presentationService');
const mindmapService = require('./mindmapService');
const chatbotService = require('./chatbotService');
const downloadService = require('./downloadService');

module.exports = {
  aiService,
  textService,
  videoService,
  BlogService,
  pdfService,
  presentationService,
  mindmapService,
  chatbotService,
  downloadService
};