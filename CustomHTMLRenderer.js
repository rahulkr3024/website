import React, { useEffect, useRef } from 'react';

const CustomHTMLRenderer = ({ htmlContent, onInteraction }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && htmlContent) {
      // Safely inject HTML content
      containerRef.current.innerHTML = htmlContent;
      
      // Add event listeners for form interactions
      const forms = containerRef.current.querySelectorAll('form');
      forms.forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          if (onInteraction) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            onInteraction('form_submit', data);
          }
        });
      });

      // Add event listeners for button clicks
      const buttons = containerRef.current.querySelectorAll('button, input[type="button"], input[type="submit"]');
      buttons.forEach(button => {
        button.addEventListener('click', (e) => {
          if (onInteraction) {
            onInteraction('button_click', {
              id: button.id,
              className: button.className,
              text: button.textContent || button.value
            });
          }
        });
      });

      // Add event listeners for input changes
      const inputs = containerRef.current.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('change', (e) => {
          if (onInteraction) {
            onInteraction('input_change', {
              id: input.id,
              name: input.name,
              value: input.value,
              type: input.type
            });
          }
        });
      });
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [htmlContent, onInteraction]);

  return (
    <div 
      ref={containerRef}
      className="custom-html-content"
      style={{
        width: '100%',
        minHeight: '400px',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        background: 'white'
      }}
    />
  );
};

export default CustomHTMLRenderer;