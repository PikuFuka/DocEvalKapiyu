// frontend/src/components/UploadCard.js

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useNotification } from './Notification';

const CLASSIFICATION_TREE = {
  '1': {
    criteria: {
      A: ['1.1', '1.2'],
      B: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '2.1', '2.2'],
      C: ['1.1', '1.2', '2'],
    },
  },
  '2': {
    criteria: {
      A: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '2.1', '2.2', '3.1', '3.2'],
      B: ['1.1.1', '1.1.2', '1.1.3', '1.2.1', '1.2.2', '2.1.1', '2.1.2', '2.2.1', '2.2.2'],
      C: ['1.1.1', '1.1.2', '1.2', '1.3', '1.4.1', '1.4.2', '1.4.3', '1.4.4'],
    },
  },
  '3': {
    criteria: {
      B: ['1.2.1', '1.2.2', '1.3.1', '1.3.2', '1.5.1', '1.5.2', '2.1.1', '2.1.2'],
      C: ['1'],
      D: ['1.1.1', '1.1.2', '1.1.3', '1.1.4', '1.1.5', '1.1.6', '1.1.7', '1.1.8', '1.1.9', '1.1.10', '1.2.1', '1.2.2', '1.2.3', '1.2.4', '1.2.5', '1.2.6'],
    },
  },
  '4': {
    criteria: {
      B: ['2.1', '2.2', '3.1', '3.2'],
      C: ['1.1', '1.2'],
    },
  },
};

const normalizeKra = (value) => String(value || '').trim();
const normalizeCriterion = (value) => String(value || '').trim().toUpperCase();
const normalizeSubSubCriterion = (value) => String(value || '').trim();

const ensureOption = (options, currentValue) => {
  const value = String(currentValue || '').trim();
  if (!value) return options;
  return options.includes(value) ? options : [value, ...options];
};

const getCriteriaOptions = (kra) => {
  return Object.keys(CLASSIFICATION_TREE[kra]?.criteria || {});
};

const getSubSubCriterionOptions = (kra, criterion) => {
  return CLASSIFICATION_TREE[kra]?.criteria?.[criterion] || [];
};

export const UploadCard = ({ upload, onUploadUpdated, showInlineReview = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [showText, setShowText] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedKra, setSelectedKra] = useState(normalizeKra(upload.primary_kra));
  const [selectedCriterion, setSelectedCriterion] = useState(normalizeCriterion(upload.criteria));
  const [selectedSubSubCriterion, setSelectedSubSubCriterion] = useState(normalizeSubSubCriterion(upload.sub_criteria));
  const { notify } = useNotification();

  const isCompleted = upload.status === 'completed';
  const isForReview = upload.status === 'for_review';
  const shouldShowReviewPanel = isForReview && showInlineReview;
  const isExpandable = isCompleted || isForReview;
  const canShowScore = isCompleted && upload.success;

  useEffect(() => {
    setSelectedKra(normalizeKra(upload.primary_kra));
    setSelectedCriterion(normalizeCriterion(upload.criteria));
    setSelectedSubSubCriterion(normalizeSubSubCriterion(upload.sub_criteria));
  }, [upload.id, upload.primary_kra, upload.criteria, upload.sub_criteria]);

  const kraOptions = useMemo(() => {
    return ensureOption(Object.keys(CLASSIFICATION_TREE), selectedKra);
  }, [selectedKra]);

  const criterionOptions = useMemo(() => {
    const options = getCriteriaOptions(selectedKra);
    return ensureOption(options, selectedCriterion);
  }, [selectedKra, selectedCriterion]);

  const subSubCriterionOptions = useMemo(() => {
    const options = getSubSubCriterionOptions(selectedKra, selectedCriterion);
    return ensureOption(options, selectedSubSubCriterion);
  }, [selectedKra, selectedCriterion, selectedSubSubCriterion]);

  const isSelectionComplete = Boolean(selectedKra && selectedCriterion && selectedSubSubCriterion);

  const displayKra = (isForReview ? selectedKra : upload.primary_kra) || 'N/A';
  const displayCriterion = (isForReview ? selectedCriterion : upload.criteria) || 'N/A';
  const displaySubSubCriterion = (isForReview ? selectedSubSubCriterion : upload.sub_criteria) || 'N/A';

  const handleKraChange = (event) => {
    const nextKra = normalizeKra(event.target.value);
    const nextCriteria = getCriteriaOptions(nextKra);
    const nextCriterion = nextCriteria.includes(selectedCriterion) ? selectedCriterion : (nextCriteria[0] || '');
    const nextSubSubCriteria = getSubSubCriterionOptions(nextKra, nextCriterion);
    const nextSubSubCriterion = nextSubSubCriteria.includes(selectedSubSubCriterion)
      ? selectedSubSubCriterion
      : (nextSubSubCriteria[0] || '');

    setSelectedKra(nextKra);
    setSelectedCriterion(nextCriterion);
    setSelectedSubSubCriterion(nextSubSubCriterion);
  };

  const handleCriterionChange = (event) => {
    const nextCriterion = normalizeCriterion(event.target.value);
    const nextSubSubCriteria = getSubSubCriterionOptions(selectedKra, nextCriterion);
    const nextSubSubCriterion = nextSubSubCriteria.includes(selectedSubSubCriterion)
      ? selectedSubSubCriterion
      : (nextSubSubCriteria[0] || '');

    setSelectedCriterion(nextCriterion);
    setSelectedSubSubCriterion(nextSubSubCriterion);
  };

  const handleSubSubCriterionChange = (event) => {
    setSelectedSubSubCriterion(normalizeSubSubCriterion(event.target.value));
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { className: 'status-completed', text: 'Completed', icon: 'bi-check-circle-fill', color: 'var(--success-color)' };
      case 'for_review':
        return { className: 'status-processing', text: 'For Review', icon: 'bi-eye-fill', color: 'var(--warning-color)' };
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

  const handleConfirmClassification = async (event) => {
    event.stopPropagation();
    if (confirming) return;

    if (!isSelectionComplete) {
      notify.warning('Please select KRA, Criterion, and Sub-Subcriterion before continuing.');
      return;
    }

    try {
      setConfirming(true);
      notify.info('Running extraction and sending results to Google Sheets...');
      await api.post(`/uploads/${upload.id}/confirm/`, {
        primary_kra: selectedKra,
        criteria: selectedCriterion,
        sub_criteria: selectedSubSubCriterion,
      });
      notify.success('Classification confirmed. Extraction and sheet export completed.');
      if (onUploadUpdated) {
        await onUploadUpdated(true);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'Failed to continue processing this upload.';
      notify.error(errorMsg);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <motion.div 
      className="upload-card-modern upload-card-even h-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* Compact Header - Always Visible */}
      <div 
        className="card-header-compact"
        onClick={() => isExpandable && setExpanded(!expanded)}
        style={{ cursor: isExpandable ? 'pointer' : 'default' }}
      >
        <div className="header-left">
          <div className="status-badge" style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color }}>
            <i className={`bi ${statusInfo.icon} me-1`}></i>
            {isCompleted ? 'Document Evaluated' : (isForReview ? 'Classification Ready' : (upload.status || 'Processing...'))}
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
          {canShowScore && (
            <div className="score-pill" style={{ backgroundColor: score === 0 ? 'var(--warning-color)' : getScoreColor(score), color: score === 0 ? '#000' : 'white' }}>
              {score === 0 ? 'Need Manual Checking' : (upload.equivalent_percentage || `${score}pts`)}
            </div>
          )}
          <span className={`status-dot ${statusInfo.className}`} title={statusInfo.text}></span>
          {isExpandable && (
            <i className={`bi bi-chevron-${expanded ? 'up' : 'down'} expand-icon`}></i>
          )}
        </div>
      </div>

      {/* Result Bar - Always Visible for completed/review */}
      {(isCompleted || isForReview) && (
        <div className="result-bar">
          <div className="result-item">
            <span className="result-label"><i className="bi bi-bookmark-star me-1"></i> KRA</span>
            <span className="result-value">{displayKra}</span>
          </div>
          <div className="result-item">
            <span className="result-label"><i className="bi bi-list-check me-1"></i> Criterion</span>
            <span className="result-value">{displayCriterion}</span>
          </div>
          <div className="result-item">
            <span className="result-label"><i className="bi bi-layers me-1"></i> Sub-Subcriterion</span>
            <span className="result-value">{displaySubSubCriterion}</span>
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
        
        {upload.classification_time && (
          <span className="info-time-badge ms-2">
            <i className="bi bi-clock me-1"></i>
            Classification: {parseFloat(upload.classification_time).toFixed(1)}s
          </span>
        )}
        
        {upload.total_processing_time && (
          <span className="info-time-badge ms-2">
            <i className="bi bi-cpu me-1"></i>
            Total: {parseFloat(upload.total_processing_time).toFixed(1)}s
          </span>
        )}

        {isForReview && !showInlineReview && (
          <Link
            to="/classification-review"
            className="btn btn-sm btn-outline-primary rounded-pill px-3 ms-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="bi bi-arrow-up-right-square me-1"></i>
            Review Queue
          </Link>
        )}
      </div>

      {/* Review Action */}
      {shouldShowReviewPanel && (
        <div className="px-3 pb-3">
          <div className="classification-review-panel">
            <div className="classification-review-header">
              <div className="classification-review-title">
                <span className="classification-review-kicker">Classification Review</span>
                <h6 className="mb-1">Check classification first</h6>
                <p className="mb-0">If output is wrong, adjust the dropdowns before continuing.</p>
              </div>
              <div className="classification-review-badge">
                <i className="bi bi-shield-check me-2"></i>
                Review Required
              </div>
            </div>

            <div className="row g-3 mt-1 classification-review-grid">
              <div className="col-12 col-md-4 classification-control">
                <label className="form-label classification-label mb-1">KRA</label>
                <select
                  className="form-select classification-select"
                  value={selectedKra}
                  onChange={handleKraChange}
                  disabled={confirming}
                >
                  <option value="">Select KRA</option>
                  {kraOptions.map((kra) => (
                    <option key={kra} value={kra}>{`KRA ${kra}`}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-4 classification-control">
                <label className="form-label classification-label mb-1">Criterion</label>
                <select
                  className="form-select classification-select"
                  value={selectedCriterion}
                  onChange={handleCriterionChange}
                  disabled={confirming || !selectedKra}
                >
                  <option value="">Select Criterion</option>
                  {criterionOptions.map((criterion) => (
                    <option key={criterion} value={criterion}>{criterion}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-4 classification-control">
                <label className="form-label classification-label mb-1">Sub-Subcriterion</label>
                <select
                  className="form-select classification-select"
                  value={selectedSubSubCriterion}
                  onChange={handleSubSubCriterionChange}
                  disabled={confirming || !selectedKra || !selectedCriterion}
                >
                  <option value="">Select Sub-Subcriterion</option>
                  {subSubCriterionOptions.map((subSubCriterion) => (
                    <option key={subSubCriterion} value={subSubCriterion}>{subSubCriterion}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="classification-review-footer d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-3 pt-3">
              <small className="classification-review-selected">
                Selected output: KRA {displayKra} / {displayCriterion} / {displaySubSubCriterion}
              </small>

              <button
                type="button"
                className="btn btn-dark btn-sm classification-confirm-btn"
                onClick={handleConfirmClassification}
                disabled={confirming || !isSelectionComplete}
              >
                {confirming ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-2"></i>
                    Confirm and Continue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
        {expanded && isExpandable && (
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
                    <span className="value">{displayKra}</span>
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
                    <span className="value">{displayCriterion}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Sub-Subcriterion</span>
                    <span className="value">{displaySubSubCriterion}</span>
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