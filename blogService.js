const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

class BlogService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  async extractContent(blogUrl) {
    try {
      console.log(`📰 Fetching blog content from: ${blogUrl}`);
      
      const response = await axios.get(blogUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,/;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 30000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Extract content using multiple strategies
      const content = this.extractArticleContent($);
      const metadata = this.extractMetadata($, blogUrl);
      
      return {
        ...content,
        ...metadata,
        url: blogUrl,
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Blog extraction error:', error);
      throw new Error(`Failed to extract content from blog: ${error.message}`);
    }
  }

  extractArticleContent($) {
    let content = '';
    let title = '';
    
    // Try multiple selectors for title
    const titleSelectors = [
      'h1',
      '.entry-title',
      '.post-title',
      '.article-title',
      '[class*="title"]',
      'title'
    ];
    
    for (const selector of titleSelectors) {
      const titleElement = $(selector).first();
      if (titleElement.length && titleElement.text().trim()) {
        title = titleElement.text().trim();
        break;
      }
    }

    // Try multiple selectors for content
    const contentSelectors = [
      'article',
      '.entry-content',
      '.post-content',
      '.article-content',
      '.content',
      '[class*="content"]',
      '.post-body',
      '.entry',
      'main'
    ];

    for (const selector of contentSelectors) {
      const contentElement = $(selector).first();
      if (contentElement.length) {
        // Remove unwanted elements
        contentElement.find('script, style, nav, header, footer, .comments, .sidebar, .advertisement').remove();
        
        const textContent = contentElement.text().trim();
        if (textContent.length > content.length) {
          content = textContent;
        }
      }
    }

    // If no content found, try body as fallback
    if (!content) {
      $('script, style, nav, header, footer').remove();
      content = $('body').text().trim();
    }

    // Clean up content
    content = this.cleanContent(content);
    
    // Extract paragraphs for better structure
    const paragraphs = content.split('\n').filter(p => p.trim().length > 20);
    
    return {
      title: title || 'Untitled',
      content: content,
      paragraphs: paragraphs,
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      estimatedReadTime: Math.ceil(content.split(/\s+/).length / 200) // 200 words per minute
    };
  }

  extractMetadata($, url) {
    const metadata = {
      author: '',
      publishDate: '',
      modifiedDate: '',
      excerpt: '',
      keywords: [],
      image: ''
    };

    // Extract metadata using meta tags
    $('meta').each((_, element) => {
      const name = $(element).attr('name');
      const property = $(element).attr('property');
      const content = $(element).attr('content');

      if (name === 'author' || property === 'article:author') {
        metadata.author = content || '';
      } else if (name === 'description' || property === 'og:description') {
        metadata.excerpt = content || '';
      } else if (name === 'keywords') {
        metadata.keywords = content ? content.split(',').map(tag => tag.trim()) : [];
      } else if (property === 'og:image' || property === 'twitter:image') {
        metadata.image = content || '';
      }
    });

    // Extract publish and modified dates
    const dateSelectors = [
      'time[datetime]',
      'meta[property="article:published_time"]',
      'meta[property="article:modified_time"]',
      'meta[name="publish_date"]',
      'meta[name="modification_date"]'
    ];

    for (const selector of dateSelectors) {
      const dateElement = $(selector).first();
      if (dateElement.length) {
        const dateValue = dateElement.attr('datetime') || dateElement.attr('content');
        if (selector.includes('published')) {
          metadata.publishDate = dateValue || '';
        } else if (selector.includes('modified')) {
          metadata.modifiedDate = dateValue || '';
        }
      }
    }

    // Fallback to structured data if available
    const structuredData = this.extractStructuredData($);
    if (structuredData) {
      metadata.author = metadata.author || structuredData.author;
      metadata.publishDate = metadata.publishDate || structuredData.publishDate;
      metadata.modifiedDate = metadata.modifiedDate || structuredData.modifiedDate;
      metadata.excerpt = metadata.excerpt || structuredData.excerpt;
      metadata.keywords = metadata.keywords.length ? metadata.keywords : structuredData.keywords;
      metadata.image = metadata.image || structuredData.image;
    }

    return metadata;
  }

  extractStructuredData($) {
    const scriptElement = $('script[type="application/ld+json"]').first();
    if (scriptElement.length) {
      try {
        const jsonData = JSON.parse(scriptElement.html());
        if (jsonData['@type'] === 'BlogPosting') {
          return {
            author: jsonData.author ? jsonData.author.name : '',
            publishDate: jsonData.datePublished || '',
            modifiedDate: jsonData.dateModified || '',
            excerpt: jsonData.description || '',
            keywords: jsonData.keywords ? jsonData.keywords.split(',').map(tag => tag.trim()) : [],
            image: jsonData.image ? (Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image) : ''
          };
        }
      } catch (e) {
        console.error('Error parsing structured data:', e);
      }
    }
    return null;
  }

  cleanContent(content) {
    // Basic cleanup
    let cleaned = content
      .replace(/\n+/g, '\n')
      .replace(/^\s+|\s+$/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();

    // Remove any remaining HTML entities
    cleaned = cleaned.replace(/&[a-zA-Z0-9#]+;/g, '');

    return cleaned;
  }
}

module.exports = BlogService;