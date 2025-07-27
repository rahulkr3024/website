const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pdf = require('html-pdf');
const aiService = require('./aiService');

class DownloadService {
  constructor() {
    this.downloadDir = path.join(__dirname, '../downloads');
    this.tempDir = path.join(__dirname, '../temp');
    this.downloadHistory = [];
    
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.downloadDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }

  async validateDownload(filePath, type) {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Validate file type
      const extension = path.extname(filePath).toLowerCase();
      const allowedExtensions = {
        presentation: ['.pptx', '.pdf'],
        mindmap: ['.svg', '.png', '.html', '.json'],
        document: ['.pdf', '.txt', '.docx']
      };
      
      if (!allowedExtensions[type] || !allowedExtensions[type].includes(extension)) {
        throw new Error('Invalid file type');
      }
      
      // Check file size (max 100MB)
      const stats = await fs.stat(filePath);
      if (stats.size > 100 * 1024 * 1024) {
        throw new Error('File too large');
      }
      
      return true;
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  async generatePDF(content, title, format = 'A4') {
    try {
      const processedContent = await this.processContentForFormat(content, 'descriptive');
      const html = this.generateHTMLForPDF(processedContent, title);
      
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}-${uuidv4()}.pdf`;
      const filepath = path.join(this.downloadDir, filename);
      
      const options = {
        format: format,
        orientation: 'portrait',
        border: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        header: {
          height: '0.75in',
          contents: `<div style="text-align: center; font-size: 12px; color: #666;">${title}</div>`
        },
        footer: {
          height: '0.75in',
          contents: {
            default: '<div style="text-align: center; font-size: 10px; color: #666;">{{page}} / {{pages}}</div>'
          }
        }
      };
      
      return new Promise((resolve, reject) => {
        pdf.create(html, options).toFile(filepath, (err, res) => {
          if (err) {
            reject(err);
          } else {
            this.addToHistory({
              type: 'pdf',
              filename: filename,
              filepath: filepath,
              title: title,
              size: res.filename ? 0 : 0 // Will be updated after file is created
            });
            
            resolve({
              filename: filename,
              filepath: filepath,
              downloadUrl: `/api/download/pdf/${filename}`
            });
          }
        });
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  async generateTXT(content, title, format = 'keypoints') {
    try {
      const processedContent = await this.processContentForFormat(content, format);
      const textContent = this.formatContentAsText(processedContent, title);
      
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}-${uuidv4()}.txt`;
      const filepath = path.join(this.downloadDir, filename);
      
      await fs.writeFile(filepath, textContent, 'utf8');
      
      this.addToHistory({
        type: 'txt',
        filename: filename,
        filepath: filepath,
        title: title,
        size: Buffer.byteLength(textContent, 'utf8')
      });
      
      return {
        filename: filename,
        filepath: filepath,
        downloadUrl: `/api/download/txt/${filename}`
      };
    } catch (error) {
      console.error('TXT generation error:', error);
      throw new Error('Failed to generate TXT file');
    }
  }

  async generateDOCX(content, title, format = 'descriptive') {
    try {
      // For DOCX generation, we'll create a simple HTML structure
      // and save it as a .docx file (basic implementation)
      const processedContent = await this.processContentForFormat(content, format);
      const docxContent = this.formatContentAsHTML(processedContent, title);
      
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}-${uuidv4()}.docx`;
      const filepath = path.join(this.downloadDir, filename);
      
      // Simple DOCX generation (HTML-based)
      // In production, use a proper DOCX library like docx or officegen
      await fs.writeFile(filepath, docxContent, 'utf8');
      
      this.addToHistory({
        type: 'docx',
        filename: filename,
        filepath: filepath,
        title: title,
        size: Buffer.byteLength(docxContent, 'utf8')
      });
      
      return {
        filename: filename,
        filepath: filepath,
        downloadUrl: `/api/download/docx/${filename}`
      };
    } catch (error) {
      console.error('DOCX generation error:', error);
      throw new Error('Failed to generate DOCX file');
    }
  }

  async generateCopyText(content, format = 'keypoints') {
    try {
      const processedContent = await this.processContentForFormat(content, format);
      return this.formatContentForCopy(processedContent, format);
    } catch (error) {
      console.error('Copy text generation error:', error);
      throw new Error('Failed to generate copy text');
    }
  }

  async processContentForFormat(content, format) {
    switch (format) {
      case 'keypoints':
        return await aiService.generateKeyPoints(content);
      case 'descriptive':
        return await aiService.generateDescriptive(content);
      case 'shortnotes':
        return await aiService.generateShortNotes(content);
      case 'mindmap':
        return await aiService.generateMindmapData(content);
      default:
        return await aiService.generateKeyPoints(content);
    }
  }

  generateHTMLForPDF(content, title) {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        
        h1 {
            color: #2c5aa0;
            border-bottom: 3px solid #2c5aa0;
            padding-bottom: 10px;
        }
        
        h2 {
            color: #2c5aa0;
            margin-top: 25px;
        }
        
        h3 {
            color: #666;
            margin-top: 20px;
        }
        
        ul, ol {
            margin: 10px 0;
            padding-left: 30px;
        }
        
        li {
            margin: 5px 0;
        }
        
        .section {
            margin: 20px 0;
            padding: 15px;
            border-left: 4px solid #2c5aa0;
            background-color: #f8f9fa;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
`;

    if (content.executiveSummary) {
      html += `
    <div class="section">
        <h2>Executive Summary</h2>
        <p>${content.executiveSummary}</p>
    </div>
`;
    }

    if (content.keyPoints && Array.isArray(content.keyPoints)) {
      html += `
    <div class="section">
        <h2>Key Points</h2>
`;
      content.keyPoints.forEach(point => {
        if (point.theme && point.points) {
          html += `
        <h3>${point.theme}</h3>
        <ul>
`;
          point.points.forEach(subPoint => {
            html += `            <li>${subPoint}</li>\n`;
          });
          html += `        </ul>\n`;
        }
      });
      html += `    </div>\n`;
    }

    if (content.sections && Array.isArray(content.sections)) {
      content.sections.forEach(section => {
        html += `
    <div class="section">
        <h2>${section.heading}</h2>
        <p>${section.content}</p>
    </div>
`;
      });
    }

    if (content.takeaways && Array.isArray(content.takeaways)) {
      html += `
    <div class="section">
        <h2>Key Takeaways</h2>
        <ul>
`;
      content.takeaways.forEach(takeaway => {
        html += `            <li>${takeaway}</li>\n`;
      });
      html += `        </ul>
    </div>
`;
    }

    html += `
    <div class="footer">
        Generated on ${new Date().toLocaleDateString()} by Content Analyzer
    </div>
</body>
</html>
`;

    return html;
  }

  formatContentAsText(content, title) {
    let text = `${title.toUpperCase()}\n`;
    text += '='.repeat(title.length) + '\n\n';
    text += `Generated on: ${new Date().toLocaleString()}\n\n`;

    if (content.executiveSummary) {
      text += `EXECUTIVE SUMMARY\n`;
      text += '-'.repeat(17) + '\n';
      text += `${content.executiveSummary}\n\n`;
    }

    if (content.keyPoints && Array.isArray(content.keyPoints)) {
      text += `KEY POINTS\n`;
      text += '-'.repeat(10) + '\n';
      content.keyPoints.forEach((point, index) => {
        if (point.theme && point.points) {
          text += `\n${index + 1}. ${point.theme.toUpperCase()}\n`;
          point.points.forEach((subPoint, subIndex) => {
            text += `   ${String.fromCharCode(97 + subIndex)}) ${subPoint}\n`;
          });
        }
      });
      text += '\n';
    }

    if (content.sections && Array.isArray(content.sections)) {
      content.sections.forEach((section, index) => {
        text += `${section.heading.toUpperCase()}\n`;
        text += '-'.repeat(section.heading.length) + '\n';
        text += `${section.content}\n\n`;
      });
    }

    if (content.takeaways && Array.isArray(content.takeaways)) {
      text += `KEY TAKEAWAYS\n`;
      text += '-'.repeat(13) + '\n';
      content.takeaways.forEach((takeaway, index) => {
        text += `${index + 1}. ${takeaway}\n`;
      });
    }

    return text;
  }

  formatContentAsHTML(content, title) {
    // Simple HTML formatting for DOCX compatibility
    return this.generateHTMLForPDF(content, title);
  }

  formatContentForCopy(content, format) {
    if (format === 'keypoints' && content.keyPoints) {
      let text = '';
      content.keyPoints.forEach((point, index) => {
        if (point.theme && point.points) {
          text += `${point.theme}:\n`;
          point.points.forEach(subPoint => {
            text += `• ${subPoint}\n`;
          });
          text += '\n';
        }
      });
      return text;
    } else if (format === 'descriptive' && content.sections) {
      let text = '';
      content.sections.forEach(section => {
        text += `${section.heading}\n\n${section.content}\n\n`;
      });
      return text;
    } else if (format === 'shortnotes' && content.notes) {
      let text = '';
      content.notes.forEach(note => {
        text += `${note.category}:\n`;
        note.items.forEach(item => {
          text += `• ${item}\n`;
        });
        text += '\n';
      });
      return text;
    } else {
      return JSON.stringify(content, null, 2);
    }
  }

  addToHistory(entry) {
    entry.timestamp = new Date().toISOString();
    entry.id = uuidv4();
    
    this.downloadHistory.unshift(entry);
    
    // Keep only last 100 entries
    if (this.downloadHistory.length > 100) {
      this.downloadHistory = this.downloadHistory.slice(0, 100);
    }
  }

  getDownloadHistory(limit = 20, type = null) {
    let history = this.downloadHistory;
    
    if (type) {
      history = history.filter(entry => entry.type === type);
    }
    
    return {
      downloads: history.slice(0, limit),
      total: history.length,
      types: [...new Set(this.downloadHistory.map(entry => entry.type))]
    };
  }

  async cleanupFile(filepath) {
    try {
      await fs.unlink(filepath);
      console.log(`🗑 Cleaned up file: ${filepath}`);
    } catch (error) {
      console.error(`Failed to cleanup file ${filepath}:`, error);
    }
  }

  async cleanupOldFiles(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.downloadDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;
      
      let cleanedCount = 0;
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.downloadDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          totalSize += stats.size;
          await fs.unlink(filePath);
          cleanedCount++;
          console.log(`🗑 Cleaned up old file: ${file}`);
        }
      }
      
      return {
        cleanedFiles: cleanedCount,
        freedSpace: totalSize,
        cleanupTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Cleanup error:', error);
      throw new Error('Failed to cleanup old files');
    }
  }
}

module.exports = new DownloadService();