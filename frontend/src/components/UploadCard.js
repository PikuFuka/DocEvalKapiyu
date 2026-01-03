// frontend/src/components/UploadCard.js

import React, { useState } from 'react';

export const UploadCard = ({ upload }) => {
  const [showText, setShowText] = useState(false);
  // Determine status badge class and text
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { className: 'status-completed', text: 'Completed' };
      case 'processing':
        return { className: 'status-processing', text: 'Processing' };
      case 'pending':
        return { className: 'status-pending', text: 'Pending' };
      case 'failed':
        return { className: 'status-failed', text: 'Failed' };
      default:
        return { className: 'status-pending', text: status || 'Unknown' };
    }
  };

  const statusInfo = getStatusInfo(upload.status);

  // Helper to determine color based on confidence/score
  const getScoreColor = (score) => {
    if (typeof score !== 'number') return '#6c757d'; // Gray for N/A
    if (score >= 80) return '#28a745'; // Green
    if (score >= 60) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  return (
    <div className="upload-card fade-in">
      <div className="card-header">
        <h3>KRA: {upload.primary_kra}</h3>
        <span className={`status-badge ${statusInfo.className}`}>
          {statusInfo.text}
        </span>
      </div>
      
      <div className="card-body">
        <p><strong>Upload Date:</strong> {new Date(upload.created_at).toLocaleDateString()}</p>
        <p><strong>Drive Link:</strong>{' '}
          <a href={upload.google_drive_link} target="_blank" rel="noopener noreferrer">
            {upload.google_drive_link.substring(0, 30)}...
          </a>
        </p>

        {/* --- DISPLAY RESULTS ONLY IF PROCESSING WAS SUCCESSFUL --- */}
        {upload.status === 'completed' && upload.success && (
          <div className="results-section mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="border-bottom pb-1 mb-0 text-primary">Evaluation Results</h6>
              <span className="badge bg-success">
                Success
              </span>
            </div>

            {/* Document Information - full width block */}
            <div className="mb-4">
              <h6 className="border-bottom pb-2 mb-3">Document Information</h6>
              <ul className="list-group list-group-flush mb-3">
                <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                  <strong>Pages Processed:</strong>
                  <span className="badge bg-secondary">{upload.page_count ?? 'N/A'}</span>
                </li>
                <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Text Extracted:</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary ms-2"
                    onClick={() => setShowText(!showText)}
                  >
                    {showText ? 'Hide' : 'Show'}
                  </button>
                </li>
              </ul>
              {showText && (
                <div className="bg-light p-3 rounded small">
                  <p className="mb-0 text-muted">{upload.extracted_text_preview || 'No preview available.'}</p>
                </div>
              )}
            </div>

            {/* Classification & Scoring - full width block */}
            <div>
              <h6 className="border-bottom pb-2 mb-3">Classification & Scoring</h6>
              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
                <div>
                  <strong>Primary KRA:</strong>
                  <div className="mt-1 h5 mb-0">{upload.primary_kra || 'N/A'}</div>
                </div>
                {upload.kra_confidence !== null && upload.kra_confidence !== undefined && (
                  <span className="badge bg-primary fs-6">
                    {upload.kra_confidence}% Confident
                  </span>
                )}
              </div>

              <div className="border rounded p-3 mb-3">
                <strong>Criterion:</strong>
                <div className="mt-2">{upload.criteria || 'N/A'}</div>
              </div>
              <div className="border rounded p-3 mb-3">
                <strong>Sub-Criterion:</strong>
                <div className="mt-2">{upload.sub_criteria || 'N/A'}</div>
              </div>

              <div className="mt-3 p-3 rounded text-white" style={{ backgroundColor: getScoreColor(
                upload.equivalent_percentage ? parseFloat(String(upload.equivalent_percentage).replace('%','')) : upload.total_score
              )}}>
                <strong>Total Points:</strong>
                <span className="ms-2 fs-5 fw-bold">
                  {upload.equivalent_percentage || `${upload.total_score || 'N/A'}`}
                </span>
              </div>

              {upload.explanation && (
                <div className="mt-4">
                  <h6 className="border-bottom pb-2 mb-2">Analysis</h6>
                  <p className="mb-0 text-muted small">{upload.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- DISPLAY ERROR MESSAGE IF PROCESSING FAILED --- */}
        {upload.status === 'failed' && (
          <div className="alert alert-danger mt-3 mb-0">
            <h6 className="alert-heading">Processing Failed</h6>
            <p className="mb-0">{upload.error_message || 'An error occurred during document processing.'}</p>
          </div>
        )}

        {/* --- DISPLAY PROCESSING MESSAGE --- */}
        {(upload.status === 'processing' || upload.status === 'pending') && (
          <div className="alert alert-info mt-3 mb-0">
            <p className="mb-0">
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Document is being processed. Please check back later for results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};