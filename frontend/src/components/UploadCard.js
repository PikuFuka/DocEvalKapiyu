// frontend/src/components/UploadCard.js

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const UploadCard = ({ upload }) => {
  const [expanded, setExpanded] = useState(false);
  const [showText, setShowText] = useState(false);

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { className: 'status-completed', text: 'Completed', icon: 'bi-check-circle-fill', color: 'var(--success-color)' };
      case 'processing':
        return { className: 'status-processing', text: 'Processing', icon: 'bi-arrow-repeat', color: 'var(--primary-color)' };
      case 'pending':
        return { className: 'status-pending', text: 'Pending', icon: 'bi-clock-fill', color: 'var(--warning-color)' };
      case 'failed':
        return { className: 'status-failed', text: 'Failed', icon: 'bi-x-circle-fill', color: 'var(--danger-color)' };
      default:
        return { className: 'status-pending', text: status || 'Unknown', icon: 'bi-question-circle', color: 'var(--secondary-color)' };
    }
  };

  const statusInfo = getStatusInfo(upload.status);

  const getScoreColor = (score) => {
    // Requirement: score color should always be green even when low.
    if (typeof score !== 'number') return 'var(--secondary-color)';
    return 'var(--success-color)';
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 90) return { text: 'Very High', color: 'var(--success-color)' };
    if (confidence >= 75) return { text: 'High', color: 'var(--success-color)' }; // Or a lighter green
    if (confidence >= 60) return { text: 'Moderate', color: 'var(--warning-color)' };
    return { text: 'Low', color: 'var(--danger-color)' };
  };

  const score = upload.equivalent_percentage 
    ? parseFloat(String(upload.equivalent_percentage).replace('%','')) 
    : upload.total_score;

  return (
    <motion.div 
      className="upload-card-modern"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* Compact Header - Always Visible */}
      <div 
        className="card-header-compact"
        onClick={() => upload.status === 'completed' && setExpanded(!expanded)}
        style={{ cursor: upload.status === 'completed' ? 'pointer' : 'default' }}
      >
        <div className="header-left">
          <div className="status-badge" style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color }}>
            <i className={`bi ${statusInfo.icon} me-1`}></i>
            {upload.status === 'completed' ? 'Document Evaluated' : (upload.status || 'Processing...')}
          </div>
          <span className="upload-date">
            <i className="bi bi-calendar3 me-1"></i>
            {new Date(upload.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="ms-2 fw-bold text-dark">
             {upload.source_filename || `Document #${upload.id}`}
          </span>
        </div>
        
        <div className="header-right">
          {upload.status === 'completed' && upload.success && (
            <div className="score-pill" style={{ backgroundColor: score === 0 ? 'var(--warning-color)' : getScoreColor(score), color: score === 0 ? '#000' : 'white' }}>
              {score === 0 ? 'Need Manual Checking' : (upload.equivalent_percentage || `${score}pts`)}
            </div>
          )}
          <span className={`status-dot ${statusInfo.className}`} title={statusInfo.text}></span>
          {upload.status === 'completed' && (
            <i className={`bi bi-chevron-${expanded ? 'up' : 'down'} expand-icon`}></i>
          )}
        </div>
      </div>

      {/* Result Bar - Always Visible for completed */}
      {upload.status === 'completed' && upload.success && (
        <div className="result-bar">
          <div className="result-item">
            <span className="result-label"><i className="bi bi-bookmark-star me-1"></i> KRA</span>
            <span className="result-value">{upload.primary_kra}</span>
          </div>
          <div className="result-item">
            <span className="result-label"><i className="bi bi-list-check me-1"></i> Criterion</span>
            <span className="result-value">{upload.criteria || 'N/A'}</span>
          </div>
          <div className="result-item">
            <span className="result-label"><i className="bi bi-layers me-1"></i> Sub-Criterion</span>
            <span className="result-value">{upload.sub_criteria || 'N/A'}</span>
          </div>
        </div>
      )}

      {/* Quick Info Row */}
      <div className="quick-info-row">
        <a 
          href={upload.google_drive_link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="drive-link"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="bi bi-google me-1"></i>
          View Document
        </a>
      </div>

      {/* Processing/Pending State */}
      {(upload.status === 'processing' || upload.status === 'pending') && (
        <div className="processing-state">
          <div className="processing-animation">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <span>Document is being analyzed...</span>
        </div>
      )}

      {/* Failed State */}
      {upload.status === 'failed' && (
        <div className="failed-state">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {upload.error_message || 'Processing failed. Please try again.'}
        </div>
      )}

      {/* Expandable Details */}
      <AnimatePresence>
        {expanded && upload.status === 'completed' && upload.success && (
          <motion.div 
            className="expanded-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="details-grid">
              {/* Classification Section */}
              <div className="detail-section">
                <h6 className="section-title">
                  <i className="bi bi-tags me-2"></i>Classification
                </h6>
                <div className="detail-items">
                  <div className="detail-item">
                    <span className="label">KRA</span>
                    <span className="value">{upload.primary_kra}</span>
                  </div>
                  {upload.kra_confidence !== null && (
                    <div className="detail-item">
                      <span className="label">Confidence</span>
                      <span 
                        className="value confidence-value"
                        style={{ color: getConfidenceLevel(upload.kra_confidence).color }}
                      >
                        {upload.kra_confidence}% ({getConfidenceLevel(upload.kra_confidence).text})
                      </span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="label">Criteria</span>
                    <span className="value">{upload.criteria || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Sub-criteria</span>
                    <span className="value">{upload.sub_criteria || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Document Info Section */}
              <div className="detail-section">
                <h6 className="section-title">
                  <i className="bi bi-file-text me-2"></i>Document Info
                </h6>
                <div className="detail-items">
                  <div className="detail-item">
                    <span className="label">Pages</span>
                    <span className="value">{upload.page_count ?? 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Extracted Text</span>
                    <button 
                      className="text-toggle-btn"
                      onClick={(e) => { e.stopPropagation(); setShowText(!showText); }}
                    >
                      {showText ? 'Hide' : 'Preview'} <i className={`bi bi-eye${showText ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {showText && (
                    <motion.div 
                      className="text-preview"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {upload.extracted_text_preview || 'No preview available.'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Analysis Explanation */}
            {upload.explanation && (
              <div className="analysis-section">
                <h6 className="section-title">
                  <i className="bi bi-lightbulb me-2"></i>Analysis
                </h6>
                <p className="analysis-text">{upload.explanation}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};