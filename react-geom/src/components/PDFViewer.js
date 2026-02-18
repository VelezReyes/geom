import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import './PDFViewer.css'; // Custom styles for additional tweaks

function PDFViewer({ fileUrl }) {
  const pdfFile = fileUrl || 'https://beta-geom-1846a6caaf3c.herokuapp.com/assets/static/images/Ex%20Ante/ARG_2014_all.pdf';
  const workerUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDocumentLoadSuccess = () => setIsLoading(false);
  const handleDocumentLoadError = (err) => {
    setError('Failed to load the document.');
    setIsLoading(false);
  };

  return (
    <div className="pdf-container">
      {isLoading && <div className="pdf-loading">Loading PDF...</div>}
      {error && <div className="pdf-error">{error}</div>}

      {!error && (
        <Worker workerUrl={workerUrl}>
          <Viewer
            fileUrl={pdfFile}
            onDocumentLoad={handleDocumentLoadSuccess}
            onDocumentLoadError={handleDocumentLoadError}
          />
        </Worker>
      )}
    </div>
  );
}

export default PDFViewer;
