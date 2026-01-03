import React, { useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { useNotification } from './Notification';

const Upload = () => {
  const [driveLinks, setDriveLinks] = useState(['']);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  const addLinkField = () => {
    setDriveLinks([...driveLinks, '']);
  };

  const removeLinkField = (index) => {
    if (driveLinks.length > 1) {
      setDriveLinks(driveLinks.filter((_, i) => i !== index));
    }
  };

  const updateLink = (index, value) => {
    const newLinks = [...driveLinks];
    newLinks[index] = value;
    setDriveLinks(newLinks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const nonEmptyLinks = driveLinks.filter(link => link.trim() !== '');

    if (nonEmptyLinks.length === 0) {
      notify.warning('Please enter at least one Google Drive link.');
      setLoading(false);
      return;
    }

    try {
      const promises = nonEmptyLinks.map(link =>
        api.post('/uploads/', { google_drive_link: link.trim() })
      );

      await Promise.all(promises);

      notify.success(`Successfully submitted ${nonEmptyLinks.length} document link(s)! They are now being processed.`);
      setDriveLinks(['']);
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
    <div className="upload-page min-vh-100 d-flex align-items-center justify-content-center py-5 position-relative overflow-hidden" style={{ background: '#f8f9fa' }}>
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
            {driveLinks.map((link, index) => (
              <motion.div
                key={index}
                className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="input-group shadow-sm rounded-3 overflow-hidden">
                  <span 
                    className="input-group-text border-0 bg-light text-muted px-3"
                  >
                    <i className="bi bi-link-45deg fs-5"></i>
                  </span>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={link}
                    onChange={(e) => updateLink(index, e.target.value)}
                    className="form-control border-0 bg-light py-3"
                    required={driveLinks.length === 1 && index === 0}
                  />
                </div>
                {driveLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLinkField(index)}
                    className="btn btn-light text-danger border rounded-3 px-3 hover-shadow"
                  >
                    <i className="bi bi-trash3-fill"></i>
                  </button>
                )}
              </motion.div>
            ))}

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-5">
              <motion.button
                type="button"
                onClick={addLinkField}
                className="btn btn-outline-primary fw-bold rounded-pill px-4 py-2"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <i className="bi bi-plus-lg me-2"></i>Add Another Link
              </motion.button>

              <motion.button
                type="submit"
                className="btn btn-primary bg-gradient fw-bold text-white rounded-pill px-5 py-2 shadow-sm"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Processing...
                  </span>
                ) : (
                  <>
                    <i className="bi bi-rocket-takeoff-fill me-2"></i>Start Evaluation
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
                <p className="text-muted small mb-0">
                  Ensure your Google Drive links are set to <strong>"Anyone with the link"</strong> or shared with the system email to allow the AI to analyze your documents.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Upload;
