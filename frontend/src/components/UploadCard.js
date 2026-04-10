// frontend/src/components/UploadCard.js

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from 'react-bootstrap';
import './ModalV2.css';
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
  const [showText, setShowText] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
  const statusHeading = isCompleted
    ? 'Document Evaluated'
    : (isForReview ? 'Classification Ready' : (upload.status || 'Processing...'));

  const getCardToneClass = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'completed':
        return 'card-tone-completed';
      case 'for_review':
        return 'card-tone-review';
      case 'processing':
      case 'pending':
        return 'card-tone-processing';
      case 'failed':
        return 'card-tone-failed';
      default:
        return 'card-tone-neutral';
    }
  };

  const cardToneClass = getCardToneClass(upload.status);
  const displayTitle = upload.source_filename || `Document #${upload.id}`;

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

  const scoreText = canShowScore
    ? (score === 0 ? 'Need Manual Checking' : (upload.equivalent_percentage || `${Number(score).toFixed(1)} pts`))
    : statusHeading;
  const scoreDisplayClass = canShowScore && score !== 0 ? 'score-orb' : 'score-pill-inline';
  const statusBadgeText = isCompleted ? 'Evaluated' : (isForReview ? 'For Review' : statusInfo.text);
  const formattedDate = new Date(upload.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

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
      className={`upload-card-modern upload-card-even upload-card-clean h-100 ${cardToneClass}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* Compact Header - Always Visible */}
      <div className="card-header-compact">
        <div className="card-meta-top">
          <div className="header-left header-meta-stack">
            <div className="status-badge status-badge-card" style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}>
              <i className={`bi ${statusInfo.icon} me-1`}></i>
              {statusBadgeText}
            </div>
            <span className="upload-date upload-date-pill upload-date-card">{formattedDate}</span>
          </div>
        </div>

        <div className="header-left">
          <span className="clean-card-title text-dark" title={displayTitle}>
            {displayTitle}
          </span>
        </div>
      </div>

      {/* Result Bar - Always Visible for completed/review */}
      {(isCompleted || isForReview) && (
        <div className="result-bar result-bar-clean">
          <div className="result-item">
            <span className="result-chip">KRA {displayKra}</span>
          </div>
          <div className="result-item">
            <span className="result-chip">CRITERION {displayCriterion}</span>
          </div>
          <div className="result-item">
            <span className="result-chip">SUB-SUBCRITERION {displaySubSubCriterion}</span>
          </div>
        </div>
      )}

      {/* Quick Info Row */}
      <div className="quick-info-row">
        <div className="quick-info-main">
          <div className={`score-pill score-pill-clean ${scoreDisplayClass}`} style={{ backgroundColor: score === 0 ? 'var(--warning-color)' : getScoreColor(score), color: score === 0 ? '#1f2937' : 'white' }}>
            {scoreText}
          </div>

          {upload.classification_time && (
            <span className="info-time-badge info-time-inline" title="Classification time">
              <i className="bi bi-clock me-1"></i>
              {parseFloat(upload.classification_time).toFixed(1)}s
            </span>
          )}

          {upload.total_processing_time && (
            <span className="info-time-badge info-time-inline" title="Total processing time">
              <i className="bi bi-cpu me-1"></i>
              {parseFloat(upload.total_processing_time).toFixed(1)}s
            </span>
          )}
        </div>

        <div className="quick-info-actions">
          <a 
            href={upload.google_drive_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="drive-link drive-link-clean"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="bi bi-google me-1"></i>
            Open
          </a>

          {isForReview && !showInlineReview && (
            <Link
              to="/classification-review"
              className="card-action-btn card-action-btn-secondary"
              onClick={(e) => e.stopPropagation()}
            >
              <i className="bi bi-arrow-up-right-square me-1"></i>
              Review Queue
            </Link>
          )}

          {isExpandable && (
            <button
              type="button"
              className="card-action-btn card-action-btn-primary"
              onClick={(event) => {
                event.stopPropagation();
                setShowModal(true);
              }}
            >
              Details
            </button>
          )}
        </div>
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

            <div className="classification-review-footer d-flex flex-column flex-sm-row justify-content-end align-items-sm-center gap-2 mt-3 pt-3">
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

      {/* Details Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        centered
        size="lg"
        scrollable
        className="upload-details-modal-v2"
      >
        <Modal.Header closeButton className="border-0 px-4 pt-4 pb-2 bg-white">
          <Modal.Title className="h5 fw-bolder text-dark mb-0">Document Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 modal-body-tinted">
          <div className="modal-document-header-v2 mb-4 p-4 shadow-sm bg-white">
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div className="badge-modern-status" style={{ color: statusInfo.color, borderColor: `${statusInfo.color}40`, backgroundColor: `${statusInfo.color}10` }}>
                  <i className={`bi ${statusInfo.icon} me-1`}></i>
                  <span className="text-capitalize">{statusBadgeText?.toLowerCase()}</span>
                </div>
                <div className="badge-modern-date text-nowrap">
                  {formattedDate}
                </div>
              </div>
              
              <div className="modal-doc-info-v2">
                <div className="d-flex align-items-center text-muted small fw-bold text-uppercase letter-spacing-1 mb-2">
                  <i className="bi bi-file-earmark-pdf me-2"></i> Source Filename
                </div>
                <div className="h5 fw-bold text-dark mb-0 line-clamp-2 lh-base">{displayTitle}</div>
              </div>
            </div>
          </div>

          <div className="details-grid-v2">
            {/* Classification Section */}
            <div className="detail-section-v2">
              <h6 className="section-title-v2">
                <i className="bi bi-tags-fill me-2 text-primary"></i>Classification
              </h6>
              <div className="detail-items-v2">
                <div className="detail-item-v2">
                  <span className="label">KRA</span>
                  <span className="value">{displayKra}</span>
                </div>
                {upload.kra_confidence !== null && (
                  <div className="detail-item-v2">
                    <span className="label">Confidence</span>
                    <span 
                      className="value confidence-value-v2"
                      style={{ color: getConfidenceLevel(upload.kra_confidence).color, fontWeight: 700 }}
                    >
                      {upload.kra_confidence}% ({getConfidenceLevel(upload.kra_confidence).text})
                    </span>
                  </div>
                )}
                <div className="detail-item-v2">
                  <span className="label">Criteria</span>
                  <span className="value">{displayCriterion}</span>
                </div>
                <div className="detail-item-v2">
                  <span className="label">Sub-Subcriterion</span>
                  <span className="value">{displaySubSubCriterion}</span>
                </div>
              </div>
            </div>

            {/* Document Info Section */}
            <div className="detail-section-v2">
              <h6 className="section-title-v2">
                <i className="bi bi-file-earmark-text-fill me-2 text-primary"></i>Document Info
              </h6>
              <div className="detail-items-v2">
                <div className="detail-item-v2">
                  <span className="label">Pages</span>
                  <span className="value">{upload.page_count ?? 'N/A'}</span>
                </div>
                <div className="detail-item-v2">
                  <span className="label">Extracted Text</span>
                  <button 
                    className="btn-preview-v2"
                    onClick={(e) => { e.stopPropagation(); setShowText(!showText); }}
                  >
                    Preview <i className={`bi bi-eye${showText ? '-slash' : ''} ms-1`}></i>
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {showText && (
                  <motion.div 
                    className="text-preview-v2"
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
            <div className="analysis-section-v2 mt-4">
              <div className="analysis-inner-v2">
                <h6 className="section-title-v2">
                  <i className="bi bi-lightbulb-fill me-2 text-warning"></i>Analysis
                </h6>
                <p className="analysis-text-v2">{upload.explanation}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 py-3 bg-white">
          <button className="btn-modal-secondary-v2 w-sm-100" onClick={() => setShowModal(false)}>
            Close
          </button>
          <a 
            href={upload.google_drive_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-modal-primary-v2 w-sm-100 justify-content-center"
          >
            <i className="bi bi-google me-2"></i>Open in Drive
          </a>
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
};