import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';

const ContentUpload = ({ analysisType, onAnalysisStart, onAnalysisComplete, loading }) => {
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      toast.success(`File "${file.name}" uploaded successfully!`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedFileTypes(),
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  function getAcceptedFileTypes() {
    switch (analysisType) {
      case 'pdf':
        return { 'application/pdf': ['.pdf'] };
      case 'video':
        return {}; // Videos will be handled via URL
      case 'blog':
        return {}; // Blogs will be handled via URL
      default:
        return { 'text/*': ['.txt', '.md'], 'application/pdf': ['.pdf'] };
    }
  }

  const handleAnalyze = async () => {
    try {
      onAnalysisStart();
      
      let result;
      
      switch (analysisType) {
        case 'text':
          if (!textContent.trim()) {
            toast.error('Please enter some text to analyze');
            return;
          }
          result = await apiService.analyzeText(textContent);
          break;
          
        case 'pdf':
          if (!uploadedFile) {
            toast.error('Please upload a PDF file');
            return;
          }
          result = await apiService.analyzePDF(uploadedFile);
          break;
          
        case 'video':
          if (!urlContent.trim()) {
            toast.error('Please enter a YouTube URL');
            return;
          }
          result = await apiService.analyzeVideo(urlContent);
          break;
          
        case 'blog':
          if (!urlContent.trim()) {
            toast.error('Please enter a blog URL');
            return;
          }
          result = await apiService.analyzeBlog(urlContent);
          break;
          
        default:
          toast.error('Please select an analysis type');
          return;
      }
      
      onAnalysisComplete(result);
      toast.success('Analysis completed successfully!');
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Analysis failed. Please try again.');
      onAnalysisComplete(null);
    }
  };

  const renderUploadArea = () => {
    if (analysisType === 'text') {
      return (
        <div className="text-input-area">
          <label htmlFor="textContent">Enter your text content:</label>
          <textarea
            id="textContent"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Paste your text here for analysis..."
            rows={8}
          />
        </div>
      );
    }

    if (analysisType === 'video' || analysisType === 'blog') {
      return (
        <div className="url-input-area">
          <label htmlFor="urlContent">
            Enter {analysisType === 'video' ? 'YouTube' : 'Blog'} URL:
          </label>
          <input
            type="url"
            id="urlContent"
            value={urlContent}
            onChange={(e) => setUrlContent(e.target.value)}
            placeholder={`Enter ${analysisType === 'video' ? 'YouTube' : 'blog'} URL here...`}
          />
        </div>
      );
    }

    return (
      <div {...getRootProps()} className={`upload-area ${isDragActive ? 'dragover' : ''}`}>
        <input {...getInputProps()} />
        <div className="upload-icon">📄</div>
        <div className="upload-text">
          {uploadedFile ? uploadedFile.name : 'Drop your file here or click to browse'}
        </div>
        <div className="upload-subtext">
          {analysisType === 'pdf' ? 'Supports PDF files up to 50MB' : 'Supports various file formats'}
        </div>
      </div>
    );
  };

  return (
    <div className="content-upload">
      {renderUploadArea()}
      
      <div className="analysis-actions">
        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Content'}
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={() => {
            setTextContent('');
            setUrlContent('');
            setUploadedFile(null);
          }}
          disabled={loading}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default ContentUpload;