import React from 'react';

const LoadingOverlay = ({ message = 'Loading Faculty Evaluation System...' }) => {
  return (
    <div className="loading-overlay">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="loading-message">{message}</div>
      </div>
    </div>
  );
};

export default LoadingOverlay;


