const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

class PDFService {
  constructor() {
    this.supportedFormats = ['.pdf', '.docx', '.epub', '.txt'];
  }

  async extractPDFContent(filePath) {
    try {
      console.log(`📄 Processing PDF: ${filePath}`);
      
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      return {
        text: this.cleanExtractedText(pdfData.text),
        pageCount: pdfData.numpages,
        wordCount: pdfData.text.split(/\s+/).length,
        metadata: pdfData.metadata || {},
        info: pdfData.info || {},
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract PDF content');
    }
  }

  async extractDocxContent(filePath) {
    try {
      console.log(`📄 Processing DOCX: ${filePath}`);
      
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;
      
      return {
        text: this.cleanExtractedText(text),
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
        warnings: result.messages || [],
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract DOCX content');
    }
  }

  async extractEpubContent(filePath) {
    try {
      console.log(`📄 Processing EPUB: ${filePath}`);
      
      // For EPUB processing, we'd typically use a library like epub2
      // This is a simplified implementation
      const EPub = require('epub2').EPub;
      
      return new Promise((resolve, reject) => {
        const epub = new EPub(filePath);
        
        epub.on('ready', () => {
          const chapters = [];
          const chapterIds = epub.flow.map(chapter => chapter.id);
          
          let processedChapters = 0;
          let fullText = '';
          
          chapterIds.forEach(chapterId => {
            epub.getChapter(chapterId, (error, text) => {
              if (error) {
                console.error('Chapter extraction error:', error);
              } else {
                // Remove HTML tags and clean text
                const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                fullText += cleanText + '\n\n';
                chapters.push({
                  id: chapterId,
                  text: cleanText
                });
              }
              
              processedChapters++;
              if (processedChapters === chapterIds.length) {
                resolve({
                  text: this.cleanExtractedText(fullText),
                  chapters: chapters,
                  wordCount: fullText.split(/\s+/).length,
                  characterCount: fullText.length,
                  metadata: epub.metadata || {},
                  extractedAt: new Date().toISOString()
                });
              }
            });
          });
        });
        
        epub.on('error', reject);
        epub.parse();
      });
    } catch (error) {
      console.error('EPUB extraction error:', error);
      throw new Error('Failed to extract EPUB content');
    }
  }

  async extractPDFPages(filePath, startPage, endPage) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      
      // For page-specific extraction, we'd need a more advanced library
      // This is a simplified version that extracts all content
      const pdfData = await pdfParse(dataBuffer);
      
      // Calculate approximate text for specific pages
      const totalPages = pdfData.numpages;
      const textPerPage = pdfData.text.length / totalPages;
      const startIndex = Math.floor((startPage - 1) * textPerPage);
      const endIndex = Math.floor(endPage * textPerPage);
      
      const extractedText = pdfData.text.substring(startIndex, endIndex);
      
      return {
        text: this.cleanExtractedText(extractedText),
        startPage,
        endPage,
        totalPages,
        wordCount: extractedText.split(/\s+/).length,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('PDF page extraction error:', error);
      throw new Error('Failed to extract PDF pages');
    }
  }

  async getPDFMetadata(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer, { max: 1 }); // Only parse metadata
      
      return {
        pages: pdfData.numpages,
        metadata: pdfData.metadata || {},
        info: pdfData.info || {},
        fileSize: (await fs.stat(filePath)).size,
        fileName: path.basename(filePath)
      };
    } catch (error) {
      console.error('PDF metadata error:', error);
      throw new Error('Failed to get PDF metadata');
    }
  }

  async getDocxMetadata(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const stats = await fs.stat(filePath);
      
      return {
        wordCount: result.value.split(/\s+/).length,
        characterCount: result.value.length,
        fileSize: stats.size,
        fileName: path.basename(filePath),
        warnings: result.messages || []
      };
    } catch (error) {
      console.error('DOCX metadata error:', error);
      throw new Error('Failed to get DOCX metadata');
    }
  }

  async getEpubMetadata(filePath) {
    try {
      const EPub = require('epub2').EPub;
      
      return new Promise((resolve, reject) => {
        const epub = new EPub(filePath);
        
        epub.on('ready', async () => {
          const stats = await fs.stat(filePath);
          
          resolve({
            title: epub.metadata.title || 'Unknown',
            author: epub.metadata.creator || 'Unknown',
            publisher: epub.metadata.publisher || 'Unknown',
            language: epub.metadata.language || 'Unknown',
            chapters: epub.flow.length,
            fileSize: stats.size,
            fileName: path.basename(filePath),
            metadata: epub.metadata
          });
        });
        
        epub.on('error', reject);
        epub.parse();
      });
    } catch (error) {
      console.error('EPUB metadata error:', error);
      throw new Error('Failed to get EPUB metadata');
    }
  }

  cleanExtractedText(text) {
    if (!text) return '';
    
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers patterns
      .replace(/^\d+\s*$/gm, '')
      // Remove common PDF artifacts
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .replace(/\f/g, ' ') // Replace form feed with space
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      // Clean up multiple newlines
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`🗑 Cleaned up file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error);
    }
  }

  isValidFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.supportedFormats.includes(ext);
  }

  async validateFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`Unsupported file format: ${ext}`);
      }
      
      if (stats.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File size exceeds 50MB limit');
      }
      
      return {
        valid: true,
        size: stats.size,
        extension: ext
      };
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  async extractTextWithOCR(filePath) {
    // Placeholder for OCR functionality
    // In production, you'd integrate with Tesseract.js or similar
    try {
      console.log('OCR extraction not implemented yet');
      throw new Error('OCR extraction requires additional setup');
    } catch (error) {
      throw new Error('OCR extraction failed');
    }
  }

  async splitDocumentByChapters(content) {
    const text = typeof content === 'string' ? content : content.text;
    
    // Simple chapter detection based on common patterns
    const chapterPatterns = [
      /^(Chapter\s+\d+|CHAPTER\s+\d+)/gim,
      /^(\d+\.\s+[A-Z][^.]*$)/gim,
      /^([A-Z][A-Z\s]{10,}$)/gim
    ];
    
    let chapters = [{ title: 'Introduction', content: text }];
    
    for (const pattern of chapterPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      if (matches.length > 1) {
        chapters = [];
        let lastIndex = 0;
        
        matches.forEach((match, index) => {
          if (index > 0) {
            chapters.push({
              title: matches[index - 1][0],
              content: text.substring(lastIndex, match.index).trim()
            });
          }
          lastIndex = match.index;
        });
        
        // Add final chapter
        chapters.push({
          title: matches[matches.length - 1][0],
          content: text.substring(lastIndex).trim()
        });
        
        break;
      }
    }
    
    return chapters.filter(chapter => chapter.content.length > 100);
  }

  async extractImages(filePath) {
    // Placeholder for image extraction from PDFs
    // Would require pdf2pic or similar library
    try {
      console.log('Image extraction not implemented yet');
      return [];
    } catch (error) {
      console.error('Image extraction error:', error);
      return [];
    }
  }

  async extractTables(filePath) {
    // Placeholder for table extraction from PDFs
    // Would require tabula-js or similar library
    try {
      console.log('Table extraction not implemented yet');
      return [];
    } catch (error) {
      console.error('Table extraction error:', error);
      return [];
    }
  }
}

module.exports = new PDFService();