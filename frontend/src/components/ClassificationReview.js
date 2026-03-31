import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { UploadCard } from './UploadCard';
import LoadingOverlay from './LoadingOverlay';
import { useNotification } from './Notification';

const ClassificationReview = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  const fetchReviewData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const response = await api.get('/user/uploads/');
      const sortedData = [...response.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setUploads(sortedData);
    } catch (error) {
      console.error('Error fetching classification review data:', error);
      if (!isBackground) {
        notify.error('Unable to load classification review queue.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchReviewData();

    const interval = setInterval(() => {
      fetchReviewData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchReviewData]);

  const reviewUploads = useMemo(() => {
    return uploads.filter((upload) => upload.status === 'for_review');
  }, [uploads]);

  const processingCount = useMemo(() => {
    return uploads.filter((upload) => upload.status === 'processing' || upload.status === 'pending').length;
  }, [uploads]);

  const completedCount = useMemo(() => {
    return uploads.filter((upload) => upload.status === 'completed').length;
  }, [uploads]);

  if (loading) return <LoadingOverlay message="Loading Classification Review..." />;

  return (
    <div className="classification-review-page min-vh-100 py-5 position-relative overflow-hidden" style={{ background: '#eef2f8' }}>
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="position-absolute top-0 end-0 rounded-circle blur-3xl opacity-25"
          style={{ width: '720px', height: '720px', background: '#60a5fa', transform: 'translate(28%, -30%)' }}
        ></div>
        <div
          className="position-absolute bottom-0 start-0 rounded-circle blur-3xl opacity-25"
          style={{ width: '620px', height: '620px', background: '#22c55e', transform: 'translate(-35%, 30%)' }}
        ></div>
      </div>

      <div className="container position-relative z-1">
        <motion.header
          className="mb-4 d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-1px' }}>Classification Review</h1>
            <p className="text-secondary mb-0">
              Confirm each AI classification before extraction and Google Sheets export.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <Link to="/upload" className="btn btn-light border rounded-pill px-4 py-2 fw-bold">
              <i className="bi bi-plus-lg me-2"></i>
              New Upload
            </Link>
            <Link to="/faculty-dashboard" className="btn btn-dark rounded-pill px-4 py-2 fw-bold">
              <i className="bi bi-speedometer2 me-2"></i>
              Dashboard
            </Link>
          </div>
        </motion.header>

        <motion.div
          className="row g-3 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {[
            {
              title: 'Ready For Review',
              value: reviewUploads.length,
              icon: 'bi-check2-square',
              bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              text: '#1e40af',
            },
            {
              title: 'Still Classifying',
              value: processingCount,
              icon: 'bi-hourglass-split',
              bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              text: '#92400e',
            },
            {
              title: 'Already Confirmed',
              value: completedCount,
              icon: 'bi-check-circle-fill',
              bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              text: '#166534',
            },
          ].map((stat) => (
            <div key={stat.title} className="col-12 col-md-4">
              <div className="card border-0 rounded-4 shadow-sm h-100">
                <div className="card-body p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-secondary text-uppercase small fw-bold mb-1">{stat.title}</h6>
                    <h3 className="fw-bold mb-0">{stat.value}</h3>
                  </div>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '54px', height: '54px', background: stat.bg, color: stat.text }}
                  >
                    <i className={`bi ${stat.icon} fs-4`}></i>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {reviewUploads.length === 0 ? (
          <motion.div
            className="card border-0 rounded-5 shadow-sm"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card-body p-5 text-center">
              <div
                className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '88px', height: '88px', background: 'rgba(13, 110, 253, 0.12)', color: '#0d6efd' }}
              >
                <i className="bi bi-check2-all fs-1"></i>
              </div>
              <h4 className="fw-bold text-dark">No pending classifications</h4>
              <p className="text-muted mb-4">
                Once a new upload is classified, it will appear here for your confirmation.
              </p>
              <Link to="/upload" className="btn btn-primary rounded-pill px-5 py-2 fw-bold">
                Upload Another Document
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="d-flex flex-column gap-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {reviewUploads.map((upload) => (
              <UploadCard
                key={upload.id}
                upload={upload}
                onUploadUpdated={fetchReviewData}
                showInlineReview
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ClassificationReview;