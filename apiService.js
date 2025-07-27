import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for large files
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'Server error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

const apiService = {
  // Text Analysis
  async analyzeText(text, format = 'keypoints') {
    const response = await apiClient.post('/text/analyze', {
      text,
      format,
    });
    return response.data;
  },

  // PDF Analysis
  async analyzePDF(file, format = 'keypoints') {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('format', format);

    const response = await apiClient.post('/pdf/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Video Analysis
  async analyzeVideo(url, format = 'keypoints') {
    const response = await apiClient.post('/video/analyze', {
      url,
      format,
    });
    return response.data;
  },

  // Blog Analysis
  async analyzeBlog(url, format = 'keypoints') {
    const response = await apiClient.post('/blog/analyze', {
      url,
      format,
    });
    return response.data;
  },

  // Generate Presentation
  async generatePresentation(content, options = {}) {
    const response = await apiClient.post('/presentation/generate', {
      content,
      ...options,
    });
    return response.data;
  },

  // Generate Mind Map
  async generateMindmap(content, options = {}) {
    const response = await apiClient.post('/mindmap/generate', {
      content,
      ...options,
    });
    return response.data;
  },

  // Download Content
  async downloadContent(content, format = 'pdf', title = 'Analysis Results') {
    const response = await apiClient.post('/download/generate', {
      content,
      format,
      title,
    }, {
      responseType: 'blob',
    });

    return {
      data: response.data,
      filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`,
    };
  },

  // Chatbot
  async askQuestion(content, question) {
    const response = await apiClient.post('/chat/ask', {
      content,
      question,
    });
    return response.data;
  },

  // Get Analysis History
  async getAnalysisHistory() {
    const response = await apiClient.get('/download/history');
    return response.data;
  },

  // Health Check
  async healthCheck() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Custom Analysis with specific format
  async customAnalysis(content, analysisType, format) {
    const endpoint = `/${analysisType}/analyze`;
    const response = await apiClient.post(endpoint, {
      content,
      format,
    });
    return response.data;
  },

  // Batch Analysis
  async batchAnalysis(items) {
    const response = await apiClient.post('/batch/analyze', {
      items,
    });
    return response.data;
  },

  // Get supported formats
  async getSupportedFormats() {
    const response = await apiClient.get('/formats');
    return response.data;
  },

  // Upload file and get analysis
  async uploadAndAnalyze(file, analysisType = 'auto') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('analysisType', analysisType);

    const response = await apiClient.post('/upload/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default apiService;