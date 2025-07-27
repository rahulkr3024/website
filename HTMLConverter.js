import React, { useState } from 'react';

const HTMLConverter = () => {
  const [htmlContent, setHtmlContent] = useState('');
  const [convertedJSX, setConvertedJSX] = useState('');

  const convertHTMLToJSX = (html) => {
    // Basic HTML to JSX conversion
    let jsx = html
      // Convert class to className
      .replace(/class=/g, 'className=')
      // Convert for to htmlFor
      .replace(/for=/g, 'htmlFor=')
      // Convert style attributes
      .replace(/style="([^"]*)"/g, (match, styles) => {
        const styleObj = styles.split(';')
          .filter(style => style.trim())
          .map(style => {
            const [property, value] = style.split(':').map(s => s.trim());
            const camelCaseProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            return `${camelCaseProperty}: '${value}'`;
          })
          .join(', ');
        return `style={{${styleObj}}}`;
      })
      // Convert self-closing tags
      .replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>]*?)>/g, '<$1$2 />')
      // Convert onclick to onClick, etc.
      .replace(/on([a-z]+)=/g, (match, event) => `on${event.charAt(0).toUpperCase() + event.slice(1)}=`);

    return jsx;
  };

  const handleConvert = () => {
    const converted = convertHTMLToJSX(htmlContent);
    setConvertedJSX(converted);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/html') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setHtmlContent(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="html-converter">
      <div className="card">
        <h2>HTML to React Converter</h2>
        <p>Upload your HTML file or paste HTML content to convert it to React JSX</p>
        
        <div className="input-group">
          <label htmlFor="htmlFile">Upload HTML File:</label>
          <input
            type="file"
            id="htmlFile"
            accept=".html,.htm"
            onChange={handleFileUpload}
          />
        </div>

        <div className="input-group">
          <label htmlFor="htmlContent">Or Paste HTML Content:</label>
          <textarea
            id="htmlContent"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="Paste your HTML content here..."
            rows={10}
          />
        </div>

        <button className="btn btn-primary" onClick={handleConvert}>
          Convert to JSX
        </button>

        {convertedJSX && (
          <div className="input-group">
            <label htmlFor="jsxOutput">Converted JSX:</label>
            <textarea
              id="jsxOutput"
              value={convertedJSX}
              readOnly
              rows={15}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
            <button
              className="btn btn-secondary"
              onClick={() => navigator.clipboard.writeText(convertedJSX)}
            >
              Copy JSX
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HTMLConverter;