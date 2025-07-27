import React from 'react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';

const AnalysisResults = ({ results, analysisType }) => {
  if (!results) return null;

  const handleDownload = async (format) => {
    try {
      const downloadResult = await apiService.downloadContent(results, format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([downloadResult.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', downloadResult.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Download failed: ${error.message}`);
    }
  };

  const renderKeyPoints = (keyPoints) => {
    if (!keyPoints || !Array.isArray(keyPoints)) return null;

    return (
      <div className="result-section">
        <h3>Key Points</h3>
        <div className="key-points">
          {keyPoints.map((point, index) => (
            <div key={index} className="key-point">
              <h4>{point.theme}</h4>
              <ul>
                {point.points.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSections = (sections) => {
    if (!sections || !Array.isArray(sections)) return null;

    return (
      <div className="result-section">
        <h3>Detailed Analysis</h3>
        {sections.map((section, index) => (
          <div key={index}>
            <h4>{section.heading}</h4>
            <p>{section.content}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderStatistics = (stats) => {
    if (!stats) return null;

    return (
      <div className="result-section">
        <h3>Content Statistics</h3>
        <div className="statistics">
          <div className="stat-item">
            <span className="stat-value">{stats.wordCount || 0}</span>
            <span className="stat-label">Words</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.sentenceCount || 0}</span>
            <span className="stat-label">Sentences</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.readingTimeMinutes || 0}</span>
            <span className="stat-label">Reading Time (min)</span>
          </div>
          {stats.complexity && (
            <div className="stat-item">
              <span className="stat-value">{stats.complexity.level}</span>
              <span className="stat-label">Complexity</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTakeaways = (takeaways) => {
    if (!takeaways || !Array.isArray(takeaways)) return null;

    return (
      <div className="result-section">
        <h3>Key Takeaways</h3>
        <ul>
          {takeaways.map((takeaway, index) => (
            <li key={index}>{takeaway}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="results-section">
      <div className="card">
        <div className="results-header">
          <h2 className="results-title">Analysis Results</h2>
          <div className="download-options">
            <button 
              className="btn btn-secondary download-btn"
              onClick={() => handleDownload('pdf')}
            >
              Download PDF
            </button>
            <button 
              className="btn btn-secondary download-btn"
              onClick={() => handleDownload('txt')}
            >
              Download TXT
            </button>
            <button 
              className="btn btn-secondary download-btn"
              onClick={() => handleDownload('docx')}
            >
              Download DOCX
            </button>
          </div>
        </div>

        <div className="results-content">
          {results.title && (
            <div className="result-section">
              <h3>{results.title}</h3>
            </div>
          )}

          {results.executiveSummary && (
            <div className="result-section">
              <h3>Executive Summary</h3>
              <p>{results.executiveSummary}</p>
            </div>
          )}

          {renderKeyPoints(results.keyPoints)}
          {renderSections(results.sections)}
          {renderStatistics(results.statistics)}
          {renderTakeaways(results.takeaways)}

          {results.insights && Array.isArray(results.insights) && (
            <div className="result-section">
              <h3>Insights</h3>
              <ul>
                {results.insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {results.conclusion && (
            <div className="result-section">
              <h3>Conclusion</h3>
              <p>{results.conclusion}</p>
            </div>
          )}

          {results.mindmapData && (
            <div className="result-section">
              <h3>Mind Map</h3>
              <div className="mindmap-container">
                <div className="mindmap-preview">
                  <p>Mind map visualization would be displayed here</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleDownload('mindmap')}
                  >
                    Download Mind Map
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;