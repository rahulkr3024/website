const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

class PresentationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.outputDir = path.join(__dirname, '../downloads');
    this.ensureOutputDir();
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create output directory:', error);
    }
  }

  async generatePresentation(content) {
    try {
      console.log('🎨 Generating presentation...');
      
      // First, analyze content and create slide structure
      const slideStructure = await this.analyzeContentForSlides(content);
      
      // Generate the PowerPoint presentation
      const pptx = new PptxGenJS();
      
      // Set presentation properties
      pptx.author = 'Content Analyzer';
      pptx.company = 'Content Analysis Platform';
      pptx.title = slideStructure.title || 'Content Analysis Presentation';
      pptx.subject = 'Generated from content analysis';
      
      // Define slide layouts and themes
      this.setupSlideLayouts(pptx);
      
      // Create title slide
      await this.createTitleSlide(pptx, slideStructure);
      
      // Create content slides
      for (const slide of slideStructure.slides) {
        await this.createContentSlide(pptx, slide);
      }
      
      // Create conclusion slide
      if (slideStructure.conclusion) {
        await this.createConclusionSlide(pptx, slideStructure.conclusion);
      }
      
      // Save presentation
      const filename = `presentation-${uuidv4()}.pptx`;
      const filepath = path.join(this.outputDir, filename);
      await pptx.writeFile({ fileName: filepath });
      return {
        type: 'presentation',
        filename: filename,
        filepath: filepath,
        slideCount: slideStructure.slides.length + 2, // +2 for title and conclusion
        downloadUrl: `/api/download/presentation/${filename}`,
        metadata: {
          title: slideStructure.title,
          createdAt: new Date().toISOString(),
          slides: slideStructure.slides.length
        }
      };
    } catch (error) {
      console.error('Presentation generation error:', error);
      throw new Error('Failed to generate presentation');
    }
  }

  async analyzeContentForSlides(content) {
    try {
      const text = this.extractText(content);
      
      const prompt = `Analyze the following content and create a professional presentation structure. 
      Break it down into logical slides with clear titles, bullet points, and key messages.
      
      Content: ${text}
      
      Create a presentation with:
      1. A compelling title
      2. 5-12 content slides (depending on content length)
      3. Each slide should have a clear title and 3-5 bullet points
      4. A conclusion slide with key takeaways
      
      Format response as JSON:
      {
        "title": "Presentation Title",
        "subtitle": "Brief description",
        "slides": [
          {
            "title": "Slide Title",
            "type": "content", // content, bullet, comparison, diagram
            "content": {
              "points": ["Point 1", "Point 2", "Point 3"],
              "notes": "Speaker notes for this slide"
            }
          }
        ],
        "conclusion": {
          "title": "Key Takeaways",
          "points": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
        }
      }`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 3000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Slide analysis error:', error);
      throw new Error('Failed to analyze content for slides');
    }
  }

  setupSlideLayouts(pptx) {
    // Define master slide layout
    pptx.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: { color: 'FFFFFF' },
      margin: [0.5, 0.25, 0.5, 0.25],
      slideNumber: { x: '90%', y: '90%', fontFace: 'Arial', fontSize: 10, color: '666666' }
    });

    // Define color scheme
    this.colors = {
      primary: '2E4BC6',
      secondary: '4DABF7',
      accent: 'FF6B6B',
      text: '333333',
      lightText: '666666',
      background: 'FFFFFF'
    };
  }

  async createTitleSlide(pptx, slideStructure) {
    const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    
    // Title
    slide.addText(slideStructure.title || 'Content Analysis', {
      x: 1,
      y: 2,
      w: 8,
      h: 1.5,
      fontSize: 36,
      fontFace: 'Arial',
      color: this.colors.primary,
      bold: true,
      align: 'center'
    });
    
    // Subtitle
    if (slideStructure.subtitle) {
      slide.addText(slideStructure.subtitle, {
        x: 1,
        y: 3.5,
        w: 8,
        h: 1,
        fontSize: 18,
        fontFace: 'Arial',
        color: this.colors.text,
        align: 'center'
      });
    }
    
    // Date
    slide.addText(new Date().toLocaleDateString(), {
      x: 1,
      y: 5,
      w: 8,
      h: 0.5,
      fontSize: 14,
      fontFace: 'Arial',
      color: this.colors.lightText,
      align: 'center'
    });
    
    // Add decorative element
    slide.addShape(pptx.ShapeType.rect, {
      x: 3,
      y: 6,
      w: 4,
      h: 0.1,
      fill: { color: this.colors.secondary }
    });
  }

  async createContentSlide(pptx, slideData) {
    const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    
    // Slide title
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 28,
      fontFace: 'Arial',
      color: this.colors.primary,
      bold: true
    });
    
    // Add content based on slide type
    switch (slideData.type) {
      case 'bullet':
      case 'content':
        this.addBulletPoints(slide, slideData.content.points);
        break;
      case 'comparison':
        this.addComparisonContent(slide, slideData.content);
        break;
      case 'diagram':
        this.addDiagramContent(slide, slideData.content);
        break;
      default:
        this.addBulletPoints(slide, slideData.content.points);
    }
    
    // Add speaker notes if available
    if (slideData.content.notes) {
      slide.addNotes(slideData.content.notes);
    }
  }

  addBulletPoints(slide, points) {
    if (!points || !Array.isArray(points)) return;
    
    const bulletPoints = points.map(point => ({
      text: point,
      options: {
        fontSize: 18,
        fontFace: 'Arial',
        color: this.colors.text,
        bullet: { type: 'number', style: '1)' }
      }
    }));
    
    slide.addText(bulletPoints, {
      x: 0.5,
      y: 1.8,
      w: 9,
      h: 4.5,
      fontSize: 18,
      fontFace: 'Arial',
      color: this.colors.text,
      bullet: true
    });
  }

  addComparisonContent(slide, content) {
    // Create two-column comparison
    if (content.left && content.right) {
      // Left column
      slide.addText(content.left.title || 'Option A', {
        x: 0.5,
        y: 1.8,
        w: 4,
        h: 0.5,
        fontSize: 20,
        fontFace: 'Arial',
        color: this.colors.primary,
        bold: true
      });
      
      slide.addText(content.left.points || [], {
        x: 0.5,
        y: 2.4,
        w: 4,
        h: 3,
        fontSize: 16,
        fontFace: 'Arial',
        color: this.colors.text,
        bullet: true
      });
      
      // Right column
      slide.addText(content.right.title || 'Option B', {
        x: 5.5,
        y: 1.8,
        w: 4,
        h: 0.5,
        fontSize: 20,
        fontFace: 'Arial',
        color: this.colors.primary,
        bold: true
      });
      
      slide.addText(content.right.points || [], {
        x: 5.5,
        y: 2.4,
        w: 4,
        h: 3,
        fontSize: 16,
        fontFace: 'Arial',
        color: this.colors.text,
        bullet: true
      });
      
      // Add vertical separator
      slide.addShape(pptx.ShapeType.line, {
        x: 5,
        y: 1.8,
        w: 0,
        h: 3.5,
        line: { color: this.colors.secondary, width: 2 }
      });
    }
  }

  addDiagramContent(slide, content) {
    // Simple flowchart or process diagram
    if (content.steps && Array.isArray(content.steps)) {
      const stepWidth = 8 / content.steps.length;
      
      content.steps.forEach((step, index) => {
        const x = 1 + (index * stepWidth);
        
        // Add step box
        slide.addShape(pptx.ShapeType.rect, {
          x: x,
          y: 2.5,
          w: stepWidth - 0.2,
          h: 1,
          fill: { color: this.colors.secondary },
          line: { color: this.colors.primary, width: 2 }
        });
        
        // Add step text
        slide.addText(step, {
          x: x,
          y: 2.5,
          w: stepWidth - 0.2,
          h: 1,
          fontSize: 14,
          fontFace: 'Arial',
          color: this.colors.text,
          align: 'center',
          valign: 'middle'
        });
        
        // Add arrow to next step
        if (index < content.steps.length - 1) {
          slide.addShape(pptx.ShapeType.rightArrow, {
            x: x + stepWidth - 0.1,
            y: 2.8,
            w: 0.4,
            h: 0.4,
            fill: { color: this.colors.accent }
          });
        }
      });
    }
  }

  async createConclusionSlide(pptx, conclusion) {
    const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    
    // Title
    slide.addText(conclusion.title || 'Key Takeaways', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 28,
      fontFace: 'Arial',
      color: this.colors.primary,
      bold: true
    });
    
    // Takeaway points
    if (conclusion.points && Array.isArray(conclusion.points)) {
      slide.addText(conclusion.points, {
        x: 1,
        y: 2,
        w: 8,
        h: 4,
        fontSize: 20,
        fontFace: 'Arial',
        color: this.colors.text,
        bullet: { type: 'bullet', style: '✓' }
      });
    }
    
    // Thank you message
    slide.addText('Thank You', {
      x: 1,
      y: 6,
      w: 8,
      h: 1,
      fontSize: 24,
      fontFace: 'Arial',
      color: this.colors.primary,
      bold: true,
      align: 'center'
    });
  }

  async generateCustomPresentation(content, options = {}) {
    try {
      const {
        theme = 'professional',
        slideCount = 'auto',
        includeCharts = false,
        includeImages = false
      } = options;
      
      // Analyze content with custom options
      const slideStructure = await this.analyzeContentWithOptions(content, options);
      
      const pptx = new PptxGenJS();
      
      // Apply theme
      this.applyTheme(pptx, theme);
      
      // Generate slides with custom options
      await this.generateSlidesWithOptions(pptx, slideStructure, options);
      
      // Save presentation
      const filename = `custom-presentation-${uuidv4()}.pptx`;
      const filepath = path.join(this.outputDir, filename);
      await pptx.writeFile({ fileName: filepath });
      return {
        type: 'presentation',
        filename: filename,
        filepath: filepath,
        downloadUrl: `/api/download/presentation/${filename}`,
        options: options
      };
    } catch (error) {
      console.error('Custom presentation generation error:', error);
      throw new Error('Failed to generate custom presentation');
    }
  }

  applyTheme(pptx, theme) {
    const themes = {
      professional: {
        primary: '2E4BC6',
        secondary: '4DABF7',
        accent: 'FF6B6B',
        background: 'FFFFFF'
      },
      modern: {
        primary: '1A1A1A',
        secondary: '6C63FF',
        accent: 'FF6B9D',
        background: 'F8F9FA'
      },
      corporate: {
        primary: '003366',
        secondary: '0066CC',
        accent: 'FF9900',
        background: 'FFFFFF'
      },
      creative: {
        primary: 'E91E63',
        secondary: '9C27B0',
        accent: 'FF5722',
        background: 'FAFAFA'
      }
    };
    
    this.colors = themes[theme] || themes.professional;
  }

  async analyzeContentWithOptions(content, options) {
    const text = this.extractText(content);
    const slideCountInstruction = options.slideCount === 'auto' ? 
      'appropriate number of slides (5-12)' : 
      `exactly ${options.slideCount} slides`;
    
    const prompt = `Create a ${options.theme || 'professional'} presentation with ${slideCountInstruction}.
    
    Content: ${text}
    
    ${options.includeCharts ? 'Include data visualization suggestions where appropriate.' : ''}
    ${options.includeImages ? 'Suggest relevant image placeholders for slides.' : ''}
    
    Format as detailed JSON structure for presentation generation.`;
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000
    });
    
    return JSON.parse(response.choices[0].message.content);
  }

  async generateSlidesWithOptions(pptx, slideStructure, options) {
    // Implementation for generating slides with custom options
    // This would include chart generation, image placeholders, etc.
    
    for (const slide of slideStructure.slides) {
      if (slide.type === 'chart' && options.includeCharts) {
        await this.createChartSlide(pptx, slide);
      } else if (slide.type === 'image' && options.includeImages) {
        await this.createImageSlide(pptx, slide);
      } else {
        await this.createContentSlide(pptx, slide);
      }
    }
  }

  async createChartSlide(pptx, slideData) {
    const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    
    // Add title
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 28,
      fontFace: 'Arial',
      color: this.colors.primary,
      bold: true
    });
    
    // Add chart placeholder or actual chart data
    if (slideData.chartData) {
      slide.addChart(
        slideData.chartType || pptx.ChartType.bar,
        slideData.chartData,
        {
          x: 1,
          y: 2,
          w: 8,
          h: 4
        }
      );
    } else {
      // Add chart placeholder
      slide.addText('[Chart: ' + slideData.chartDescription + ']', {
        x: 1,
        y: 3,
        w: 8,
        h: 2,
        fontSize: 18,
        fontFace: 'Arial',
        color: this.colors.lightText,
        align: 'center',
        valign: 'middle',
        border: { type: 'solid', color: this.colors.secondary, pt: 2 }
      });
    }
  }

  async createImageSlide(pptx, slideData) {
    const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    
    // Add title
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 1,
      fontSize: 28,
      fontFace: 'Arial',
      color: this.colors.primary,
      bold: true
    });
    
    // Add image placeholder
    slide.addText('[Image: ' + slideData.imageDescription + ']', {
      x: 1,
      y: 2,
      w: 8,
      h: 3,
      fontSize: 18,
      fontFace: 'Arial',
      color: this.colors.lightText,
      align: 'center',
      valign: 'middle',
      border: { type: 'solid', color: this.colors.secondary, pt: 2 }
    });
    
    // Add caption if available
    if (slideData.caption) {
      slide.addText(slideData.caption, {
        x: 1,
        y: 5.2,
        w: 8,
        h: 0.5,
        fontSize: 14,
        fontFace: 'Arial',
        color: this.colors.text,
        align: 'center',
        italic: true
      });
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

  async cleanupOldPresentations() {
    try {
      const files = await fs.readdir(this.outputDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const file of files) {
        if (file.endsWith('.pptx')) {
          const filePath = path.join(this.outputDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            console.log(`🗑 Cleaned up old presentation: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new PresentationService();