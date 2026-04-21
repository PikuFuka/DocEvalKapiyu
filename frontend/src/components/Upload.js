import React, { useEffect, useState } from 'react';
import api, { UPLOAD_QUEUE_REQUEST_CONFIG, extractUploadsArray } from '../services/api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './Notification';

const Upload = () => {
  const [driveLinks, setDriveLinks] = useState([{ id: 1, value: '' }]);
  const [nextId, setNextId] = useState(2);
  const [linkPreviews, setLinkPreviews] = useState({}); // Store previews by link ID
  const [loading, setLoading] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [checkingQueue, setCheckingQueue] = useState(true);
  const navigate = useNavigate();
  const { notify } = useNotification();

  useEffect(() => {
    const checkPendingReviews = async () => {
      setCheckingQueue(true);
      try {
        const response = await api.get('/user/uploads/', UPLOAD_QUEUE_REQUEST_CONFIG);
        const uploads = extractUploadsArray(response.data);
        const pending = uploads.filter((upload) => upload.status === 'for_review').length;
        setPendingReviewCount(pending);
      } catch (error) {
        console.error('Failed to check pending reviews:', error);
      } finally {
        setCheckingQueue(false);
      }
    };

    checkPendingReviews();
  }, []);
  const addLinkField = () => {
    if (driveLinks.length < 5) {
      setDriveLinks([...driveLinks, { id: nextId, value: '' }]);
      setNextId(prev => prev + 1);
    } else {
      notify.warning('Maximum of 5 links allowed.');
    }
  };

  const removeLinkField = (linkId) => {
    if (driveLinks.length > 1) {
      setDriveLinks(driveLinks.filter(link => link.id !== linkId));
      const newPreviews = { ...linkPreviews };
      delete newPreviews[linkId];
      setLinkPreviews(newPreviews);
    }
  };

  const updateLink = (linkId, value) => {
    setDriveLinks(driveLinks.map(link => link.id === linkId ? { ...link, value } : link));
  };

  const handleBlur = async (linkId, link) => {
    if (!link || link.trim() === '') return;
    
    setLinkPreviews(prev => ({
        ...prev,
        [linkId]: { name: 'Checking...', status: 'loading' }
    }));
    
    try {
      const response = await api.post('/uploads/peek/', { link: link.trim() });
      const { name, mimeType } = response.data;
      
      let displayName = name;
      let icon = 'bi-file-earmark-check';
      
      if (mimeType === 'application/vnd.google-apps.folder') {
          displayName = `Folder: ${name}`;
          icon = 'bi-folder-fill';
      } else if (mimeType === 'application/pdf') {
          icon = 'bi-file-pdf-fill';
      } else if (mimeType.includes('document')) {
          icon = 'bi-file-word-fill';
      }
      
      setLinkPreviews(prev => ({
        ...prev,
        [linkId]: { name: displayName, status: 'success', icon: icon }
      }));
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Invalid Link or Access Denied';
      setLinkPreviews(prev => ({
        ...prev,
        [linkId]: { name: errorMsg, status: 'error' }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (checkingQueue) {
      notify.info('Checking review queue. Please try again in a moment.');
      return;
    }

    if (pendingReviewCount > 0) {
      notify.warning('Finish reviewing pending classification results in the review queue before submitting another batch.');
      navigate('/classification-review');
      return;
    }

    setLoading(true);

    const nonEmptyLinks = driveLinks.filter(link => link.value.trim() !== '').map(link => link.value.trim());

    if (nonEmptyLinks.length === 0) {
      notify.warning('Please enter at least one Google Drive link.');
      setLoading(false);
      return;
    }

    try {
      const queueResponse = await api.get('/user/uploads/', UPLOAD_QUEUE_REQUEST_CONFIG);
      const queueUploads = extractUploadsArray(queueResponse.data);
      const pending = queueUploads.filter((upload) => upload.status === 'for_review').length;
      setPendingReviewCount(pending);

      if (pending > 0) {
        notify.warning('Finish reviewing pending classification results in the review queue before submitting another batch.');
        navigate('/classification-review');
        return;
      }

      notify.info('Starting classification... Please wait.');
      await api.post('/uploads/', { google_drive_links: nonEmptyLinks });

      notify.success(
        `Successfully submitted ${nonEmptyLinks.length} document link(s). Please review and confirm all classification results before continuing to dashboard.`
      );
      setDriveLinks([{ id: nextId, value: '' }]);
      setNextId(prev => prev + 1);
      setLinkPreviews({});
      navigate('/classification-review');
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'An error occurred while uploading.';
      notify.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page min-vh-100 d-flex align-items-center justify-content-center py-5 position-relative" style={{ background: '#f8f9fa' }}>
      {/* Background Shapes */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="position-absolute top-0 end-0 bg-primary opacity-10 rounded-circle blur-3xl" style={{ width: '600px', height: '600px', transform: 'translate(30%, -30%)' }}></div>
        <div className="position-absolute bottom-0 start-0 bg-success opacity-10 rounded-circle blur-3xl" style={{ width: '500px', height: '500px', transform: 'translate(-30%, 30%)' }}></div>
      </div>

      <motion.div
        className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white position-relative z-1"
        style={{ width: '100%', maxWidth: '800px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card-body p-4 p-md-5">
          <motion.div
            className="text-center mb-5"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div 
              className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-primary bg-gradient text-white rounded-circle shadow-sm"
              style={{ width: '72px', height: '72px' }}
            >
              <i className="bi bi-cloud-arrow-up fs-1"></i>
            </div>
            <h2 className="fw-bold text-dark mb-2">Upload Documents</h2>
            <p className="text-muted">
              Enter Google Drive links for intelligent evaluation
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {pendingReviewCount > 0 && (
              <div className="alert alert-warning border-0 rounded-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div className="small text-dark mb-0">
                  You have <strong>{pendingReviewCount}</strong> classification {pendingReviewCount === 1 ? 'result' : 'results'} waiting for review. Finish reviewing in the Review Queue before starting another batch.
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-dark rounded-pill px-3 fw-bold"
                  onClick={() => navigate('/classification-review')}
                >
                  Go to Review Queue
                </button>
              </div>
            )}
            {driveLinks.map((linkObj) => (
              <motion.div
                key={linkObj.id}
                className="mb-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
              <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 upload-link-row">
                <div className="flex-grow-1 position-relative upload-link-field">
                  <div className="input-group shadow-sm rounded-3 overflow-hidden upload-link-input-group">
                            <span className="input-group-text border-0 bg-light text-muted px-3">
                                <i className="bi bi-link-45deg fs-5"></i>
                            </span>
                            
                            {linkPreviews[linkObj.id]?.status === 'success' ? (
                      <div className="form-control border-0 bg-light py-3 link-preview-shell">
                        <div className="link-preview-main text-success">
                          <i className={`bi ${linkPreviews[linkObj.id].icon || 'bi-check-circle'} link-preview-icon`}></i>
                          <span className="fw-medium link-preview-name" title={linkPreviews[linkObj.id].name}>{linkPreviews[linkObj.id].name}</span>
                                    </div>
                                    <button 
                                        type="button" 
                          className="btn btn-sm btn-link text-muted p-0 ms-2 link-preview-edit"
                                        onClick={() => {
                                            const newPreviews = { ...linkPreviews };
                                            delete newPreviews[linkObj.id];
                                            setLinkPreviews(newPreviews);
                                        }}
                                        title="Edit Link"
                                    >
                                        <i className="bi bi-pencil-square"></i>
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="url"
                                    placeholder="https://drive.google.com/drive/folders/..."
                                    value={linkObj.value}
                                    onChange={(e) => updateLink(linkObj.id, e.target.value)}
                                    onBlur={(e) => handleBlur(linkObj.id, e.target.value)}
                                  className={`form-control border-0 bg-light py-3 upload-link-input ${linkPreviews[linkObj.id]?.status === 'error' ? 'is-invalid' : ''} overflow-hidden`}
                                    required={driveLinks.length === 1}
                                    disabled={linkPreviews[linkObj.id]?.status === 'loading' || loading || checkingQueue || pendingReviewCount > 0}
                                />
                            )}

                            {linkPreviews[linkObj.id]?.status === 'loading' && (
                                <span className="input-group-text border-0 bg-light text-muted px-3">
                                    <span className="spinner-border spinner-border-sm text-primary"></span>
                                </span>
                            )}
                        </div>
                        
                        {/* Error Message Only */}
                        {linkPreviews[linkObj.id]?.status === 'error' && (
                            <div className="mt-1 ms-2">
                                <small className="fw-bold text-danger">
                                    <i className="bi bi-exclamation-circle me-1"></i>
                                    {linkPreviews[linkObj.id].name}
                                </small>
                            </div>
                        )}
                    </div>
                    {driveLinks.length > 1 && (
                    <button
                        type="button"
                        onClick={() => removeLinkField(linkObj.id)}
                        className="btn btn-light text-danger border rounded-3 px-3 hover-shadow"
                        disabled={loading || checkingQueue || pendingReviewCount > 0}
                    >
                        <i className="bi bi-trash3-fill"></i>
                    </button>
                    )}
                </div>
              </motion.div>
            ))}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-5">
              <motion.button
                type="button"
                onClick={addLinkField}
                className="btn btn-outline-primary fw-bold rounded-pill px-4 py-2"
                disabled={loading || checkingQueue || pendingReviewCount > 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <i className="bi bi-plus-lg me-2"></i>Add Another Link
              </motion.button>

              <motion.button
                type="submit"
                className="btn btn-primary bg-gradient fw-bold text-white rounded-pill px-5 py-2 shadow-sm"
                disabled={loading || checkingQueue || pendingReviewCount > 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {checkingQueue ? (
                  <span className="d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Checking queue...
                  </span>
                ) : loading ? (
                  <span className="d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Classifying...
                  </span>
                ) : pendingReviewCount > 0 ? (
                  <>
                    <i className="bi bi-lock-fill me-2"></i>Finish Review First
                  </>
                ) : (
                  <>
                    <i className="bi bi-rocket-takeoff-fill me-2"></i>Start Classification
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>

          <motion.div 
            className="mt-5 p-4 rounded-4 border-0 shadow-sm"
            style={{ backgroundColor: '#fff9e6', borderLeft: '4px solid #ffc107' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="d-flex gap-3">
              <div className="text-warning">
                <i className="bi bi-exclamation-triangle-fill fs-4"></i>
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-1">Important Note</h6>
                <p className="text-muted small mb-2">
                  Ensure your Google Drive links are set to <strong>"Anyone with the link"</strong> or shared with the system email to allow the AI to analyze your documents.
                </p>
                <div className="d-flex align-items-start gap-2 mt-2 pt-2 border-top border-warning border-opacity-25">
                  <i className="bi bi-stars text-warning mt-1"></i>
                  <p className="text-muted small mb-0 fst-italic">
                    <strong>AI Disclaimer:</strong> Please review the results carefully. While our AI is accurate, it may occasionally make errors.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Upload;
