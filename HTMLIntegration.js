import React, { useState } from 'react';
import CustomHTMLRenderer from './CustomHTMLRenderer';
import HTMLConverter from './HTMLConverter';

const HTMLIntegration = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [htmlContent, setHtmlContent] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'text/html' || file.name.endsWith('.html'))) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setHtmlContent(e.target.result);
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid HTML file');
    }
  };

  const handleHTMLInteraction = (type, data) => {
    console.log('HTML Interaction:', type, data);
    
    // Handle different types of interactions
    switch (type) {
      case 'form_submit':
        // Process form submission
        console.log('Form submitted with data:', data);
        // You can integrate this with your backend API
        break;
      case 'button_click':
        // Handle button clicks
        console.log('Button clicked:', data);
        break;
      case 'input_change':
        // Handle input changes
        console.log('Input changed:', data);
        break;
      default:
        break;
    }
  };

  const sampleHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Content Analyzer</title>
    <style>
        .analyzer-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        .upload-area {
            border: 2px dashed #ccc;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
        }
        .btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn:hover {
            background: #0056b3;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input, .form-group textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="analyzer-container">
        <h1>Content Analyzer</h1>
        <p>Upload your content for AI-powered analysis</p>
        
        <form id="analysisForm">
            <div class="form-group">
                <label for="contentType">Content Type:</label>
                <select id="contentType" name="contentType">
                    <option value="text">Text</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="blog">Blog</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="textContent">Text Content:</label>
                <textarea id="textContent" name="textContent" rows="6" placeholder="Enter your text here..."></textarea>
            </div>
            
            <div class="upload-area">
                <p>Drag and drop files here or click to browse</p>
                <input type="file" id="fileUpload" name="fileUpload" accept=".pdf,.txt,.md">
            </div>
            
            <div class="form-group">
                <label for="analysisFormat">Analysis Format:</label>
                <select id="analysisFormat" name="analysisFormat">
                    <option value="keypoints">Key Points</option>
                    <option value="descriptive">Descriptive</option>
                    <option value="shortnotes">Short Notes</option>
                    <option value="mindmap">Mind Map</option>
                </select>
            </div>
            
            <button type="submit" class="btn">Analyze Content</button>
        </form>
        
        <div id="results" style="margin-top: 30px; display: none;">
            <h2>Analysis Results</h2>
            <div id="resultsContent"></div>
        </div>
    </div>
</body>
</html>`;

  return (
    <div className="html-integration">
      <div className="card">
        <div className="tab-navigation">
          <button
            className={`option-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload HTML
          </button>
          <button
            className={`option-tab ${activeTab === 'converter' ? 'active' : ''}`}
            onClick={() => setActiveTab('converter')}
          >
            HTML to React Converter
          </button>
          <button
            className={`option-tab ${activeTab === 'sample' ? 'active' : ''}`}
            onClick={() => setActiveTab('sample')}
          >
            Sample HTML
          </button>
        </div>

        {activeTab === 'upload' && (
          <div className="upload-tab">
            <h2>Upload Your HTML File</h2>
            <p>Upload your existing HTML file to integrate it with the React frontend</p>
            
            <div className="input-group">
              <label htmlFor="htmlFileUpload">Choose HTML File:</label>
              <input
                type="file"
                id="htmlFileUpload"
                accept=".html,.htm"
                onChange={handleFileUpload}
              />
            </div>

            {fileName && (
              <div className="success">
                Successfully loaded: {fileName}
              </div>
            )}

            {htmlContent && (
              <div>
                <h3>Rendered HTML Content:</h3>
                <CustomHTMLRenderer
                  htmlContent={htmlContent}
                  onInteraction={handleHTMLInteraction}
                />
                
                <div style={{ marginTop: '20px' }}>
                  <h4>Integration Options:</h4>
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab('converter')}
                  >
                    Convert to React Components
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ marginLeft: '10px' }}
                    onClick={() => {
                      // Save as new component
                      const componentCode = `
import React from 'react';
import CustomHTMLRenderer from './CustomHTMLRenderer';

const MyCustomComponent = () => {
  const htmlContent = \`${htmlContent.replace(/`/g, '\\`')}\`;
  
  const handleInteraction = (type, data) => {
    console.log('Interaction:', type, data);
    // Add your custom logic here
  };

  return (
    <CustomHTMLRenderer
      htmlContent={htmlContent}
      onInteraction={handleInteraction}
    />
  );
};

export default MyCustomComponent;`;
                      
                      navigator.clipboard.writeText(componentCode);
                      alert('Component code copied to clipboard!');
                    }}
                  >
                    Generate React Component
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'converter' && <HTMLConverter />}

        {activeTab === 'sample' && (
          <div className="sample-tab">
            <h2>Sample HTML Integration</h2>
            <p>This is an example of how your HTML content would look integrated into the React app:</p>
            
            <CustomHTMLRenderer
              htmlContent={sampleHTML}
              onInteraction={handleHTMLInteraction}
            />
            
            <div style={{ marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setHtmlContent(sampleHTML);
                  setActiveTab('upload');
                }}
              >
                Use This Sample
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HTMLIntegration;