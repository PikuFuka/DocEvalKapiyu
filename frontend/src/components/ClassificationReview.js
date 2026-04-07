import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UploadCard } from './UploadCard';
import LoadingOverlay from './LoadingOverlay';
import { useNotification } from './Notification';

const ClassificationReview = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { notify } = useNotification();

  const fetchQueue = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get('/user/uploads/');
      const data = Array.isArray(response.data) ? response.data : [];
      const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setUploads(sorted);
      setError('');
    } catch (fetchError) {
      console.error('Failed to fetch review queue:', fetchError);
      setError('Unable to load your review queue right now. Please try again.');
    } finally {
      if (isBackground) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const reviewQueue = useMemo(() => {
    return uploads.filter((upload) => upload.status === 'for_review');
  }, [uploads]);

  const processingCount = useMemo(() => {
    return uploads.filter((upload) => upload.status === 'processing' || upload.status === 'pending').length;
  }, [uploads]);

  const completedCount = useMemo(() => {
    return uploads.filter((upload) => upload.status === 'completed').length;
  }, [uploads]);

  const queueTotal = reviewQueue.length + completedCount;
  const readinessPercent = queueTotal > 0
    ? Math.round((completedCount / queueTotal) * 100)
    : (processingCount > 0 ? 0 : 100);

  useEffect(() => {
    if (!loading && reviewQueue.length === 0) {
      navigate('/faculty-dashboard', { replace: true });
    }
  }, [loading, reviewQueue.length, navigate]);

  const handleContinue = () => {
    notify.success('Review queue completed. Redirecting to dashboard.');
    navigate('/faculty-dashboard');
  };

  if (loading) {
    return <LoadingOverlay message="Loading review queue..." />;
  }

  return (
    <div className="classification-review-page min-vh-100 py-5 position-relative overflow-hidden">
      <div className="classification-review-bg" aria-hidden="true">
        <span className="classification-review-orb orb-one"></span>
        <span className="classification-review-orb orb-two"></span>
        <span className="classification-review-orb orb-three"></span>
        <span className="classification-review-noise"></span>
      </div>

      <div className="container classification-review-shell position-relative">
        <motion.header
          className="classification-review-hero mb-4"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="classification-review-hero-top">
            <span className="classification-review-stage-pill">
              <i className="bi bi-shield-check me-2"></i>
              Review Stage
            </span>
            <button
              type="button"
              className="btn classification-review-refresh-btn"
              onClick={() => fetchQueue(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <span className="d-flex align-items-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Refreshing...
                </span>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh Queue
                </>
              )}
            </button>
          </div>

          <h1 className="classification-review-heading">Review AI Classification Before Export</h1>
          <p className="classification-review-subtitle mb-0">
            Confirm each pending item below before continuing to the dashboard. Verified items move forward to final extraction and reporting.
          </p>

          <div className="classification-review-stat-grid mt-4">
            <article className="classification-review-stat-card pending">
              <span className="classification-review-stat-label">Pending Confirmation</span>
              <strong className="classification-review-stat-value">{reviewQueue.length}</strong>
            </article>
            <article className="classification-review-stat-card completed">
              <span className="classification-review-stat-label">Ready in Dashboard</span>
              <strong className="classification-review-stat-value">{completedCount}</strong>
            </article>
            <article className="classification-review-stat-card processing">
              <span className="classification-review-stat-label">Still Processing</span>
              <strong className="classification-review-stat-value">{processingCount}</strong>
            </article>
          </div>

          <div className="classification-review-progress-wrap mt-3">
            <div className="classification-review-progress-label">
              <span>Queue readiness</span>
              <strong>{readinessPercent}%</strong>
            </div>
            <div className="classification-review-progress-track">
              <span className="classification-review-progress-fill" style={{ width: `${readinessPercent}%` }}></span>
            </div>
          </div>
        </motion.header>

        {error && (
          <motion.div
            className="classification-review-error mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="small mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-circle-fill"></i>
              {error}
            </div>
            <button
              type="button"
              className="btn btn-sm classification-review-error-btn"
              onClick={() => fetchQueue()}
            >
              Retry
            </button>
          </motion.div>
        )}

        {reviewQueue.length > 0 ? (
          <>
            <motion.div
              className="classification-review-list-head d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-2 mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div>
                <h2 className="classification-review-list-title mb-1">Pending Confirmation Queue</h2>
                <p className="classification-review-list-subtitle mb-0">
                  Validate each AI classification and continue to finalize your outputs.
                </p>
              </div>
            </motion.div>

            <div className="row g-3">
            {reviewQueue.map((upload) => (
              <div key={upload.id} className="col-12 col-lg-6">
                <UploadCard upload={upload} onUploadUpdated={fetchQueue} showInlineReview />
              </div>
            ))}
            </div>
          </>
        ) : (
          <motion.div
            className="classification-review-empty card border-0 rounded-4 p-5 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="classification-review-empty-icon mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: '80px', height: '80px' }}
            >
              <i className="bi bi-check2-circle fs-1"></i>
            </div>
            <h4 className="fw-bold mb-2">All Reviews Completed</h4>
            <p className="mb-4">
              Great work. You have {completedCount} completed {completedCount === 1 ? 'document' : 'documents'} ready in your dashboard.
            </p>
            <div>
              <button
                type="button"
                className="btn classification-review-continue-btn rounded-pill px-5 py-2 fw-bold"
                onClick={handleContinue}
              >
                Continue to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ClassificationReview;
