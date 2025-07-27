const Joi = require('joi');

// Validation schemas
const schemas = {
  videoURL: Joi.object({
    url: Joi.string().uri().required().messages({
      'string.uri': 'Please provide a valid video URL',
      'any.required': 'Video URL is required'
    }),
    format: Joi.string().valid('presentation', 'keypoints', 'descriptive', 'mindmap', 'shortnotes').default('keypoints')
  }),

  blogURL: Joi.object({
    url: Joi.string().uri().required().messages({
      'string.uri': 'Please provide a valid blog URL',
      'any.required': 'Blog URL is required'
    }),
    format: Joi.string().valid('presentation', 'keypoints', 'descriptive', 'mindmap', 'shortnotes').default('keypoints')
  }),

  textInput: Joi.object({
    text: Joi.string().min(10).max(50000).required().messages({
      'string.min': 'Text must be at least 10 characters long',
      'string.max': 'Text must not exceed 50,000 characters',
      'any.required': 'Text content is required'
    }),
    title: Joi.string().max(200).optional(),
    format: Joi.string().valid('presentation', 'keypoints', 'descriptive', 'mindmap', 'shortnotes').default('keypoints')
  }),

  presentationRequest: Joi.object({
    content: Joi.alternatives().try(
      Joi.string().min(10),
      Joi.object()
    ).required().messages({
      'any.required': 'Content is required for presentation generation'
    }),
    options: Joi.object({
      theme: Joi.string().valid('professional', 'modern', 'corporate', 'creative').default('professional'),
      slideCount: Joi.alternatives().try(
        Joi.string().valid('auto'),
        Joi.number().integer().min(3).max(20)
      ).default('auto'),
      includeCharts: Joi.boolean().default(false),
      includeImages: Joi.boolean().default(false)
    }).optional()
  }),

  contentRequest: Joi.object({
    content: Joi.alternatives().try(
      Joi.string().min(10),
      Joi.object()
    ).required().messages({
      'any.required': 'Content is required'
    }),
    format: Joi.string().valid('svg', 'png', 'json', 'html').default('svg'),
    style: Joi.string().valid('tree', 'radial', 'flowchart', 'network').default('tree')
  }),

  chatRequest: Joi.object({
    sessionId: Joi.string().uuid().required().messages({
      'string.uuid': 'Invalid session ID format',
      'any.required': 'Session ID is required'
    }),
    message: Joi.string().min(1).max(2000).required().messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message must not exceed 2000 characters',
      'any.required': 'Message is required'
    }),
    context: Joi.object().optional()
  })
};

// Validation middleware functions
const validateVideoURL = (req, res, next) => {
  const { error, value } = schemas.videoURL.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  req.body = value;
  next();
};

const validateBlogURL = (req, res, next) => {
  const { error, value } = schemas.blogURL.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  req.body = value;
  next();
};

const validateTextInput = (req, res, next) => {
  const { error, value } = schemas.textInput.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  req.body = value;
  next();
};

const validatePresentationRequest = (req, res, next) => {
  const { error, value } = schemas.presentationRequest.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  req.body = value;
  next();
};

const validateContentRequest = (req, res, next) => {
  const { error, value } = schemas.contentRequest.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  req.body = value;
  next();
};

const validateChatRequest = (req, res, next) => {
  const { error, value } = schemas.chatRequest.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  req.body = value;
  next();
};

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.body = value;
    next();
  };
};

// URL validation helper
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// YouTube URL validation
const isYouTubeURL = (url) => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
  return youtubeRegex.test(url);
};

// Instagram URL validation
const isInstagramURL = (url) => {
  const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\//;
  return instagramRegex.test(url);
};

// File size validation
const validateFileSize = (maxSize = 50 * 1024 * 1024) => { // 50MB default
  return (req, res, next) => {
    if (req.file && req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: `File size must not exceed ${maxSize / (1024 * 1024)}MB`
      });
    }
    next();
  };
};

// Content type validation
const validateContentType = (allowedTypes) => {
  return (req, res, next) => {
    if (req.file && !allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: `Allowed file types: ${allowedTypes.join(', ')}`
      });
    }
    next();
  };
};

// Rate limiting validation
const validateRateLimit = (req, res, next) => {
  // This would integrate with express-rate-limit
  // For now, just pass through
  next();
};

// API key validation (if needed)
const validateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (process.env.REQUIRE_API_KEY === 'true' && !apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      message: 'Please provide a valid API key in the x-api-key header'
    });
  }
  
  // Validate API key format if provided
  if (apiKey && !/^[a-zA-Z0-9\-_]{32,}$/.test(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key format',
      message: 'API key format is invalid'
    });
  }
  
  next();
};

// Request sanitization
const sanitizeRequest = (req, res, next) => {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<script\b[^<](?:(?!<\/script>)<[^<])*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+=/gi, '');
  };
  
  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
    return obj;
  };
  
  req.body = sanitizeObject(req.body);
  next();
};

// Export all validation functions
module.exports = {
  validateVideoURL,
  validateBlogURL,
  validateTextInput,
  validatePresentationRequest,
  validateContentRequest,
  validateChatRequest,
  validate,
  validateFileSize,
  validateContentType,
  validateRateLimit,
  validateAPIKey,
  sanitizeRequest,
  isValidURL,
  isYouTubeURL,
  isInstagramURL,
  schemas
};