import React from 'react';

const AnalysisOptions = ({ analysisType, onAnalysisTypeChange }) => {
  const options = [
    { id: 'text', label: 'Text Analysis', description: 'Analyze plain text content' },
    { id: 'pdf', label: 'PDF Analysis', description: 'Extract and analyze PDF documents' },
    { id: 'video', label: 'Video Analysis', description: 'Analyze YouTube videos' },
    { id: 'blog', label: 'Blog Analysis', description: 'Analyze blog posts and articles' },
  ];

  return (
    <div className="analysis-options">
      <h3>Choose Analysis Type</h3>
      <div className="option-tabs">
        {options.map((option) => (
          <button
            key={option.id}
            className={`option-tab ${analysisType === option.id ? 'active' : ''}`}
            onClick={() => onAnalysisTypeChange(option.id)}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnalysisOptions;