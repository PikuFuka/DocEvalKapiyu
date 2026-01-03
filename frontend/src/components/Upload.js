import React, { useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';

const Upload = () => {
  const [driveLinks, setDriveLinks] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

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
    setMessage('');
    setMessageType('');

    const nonEmptyLinks = driveLinks.filter(link => link.trim() !== '');

    if (nonEmptyLinks.length === 0) {
      setMessage('Please enter at least one Google Drive link.');
      setMessageType('danger');
      setLoading(false);
      return;
    }

    try {
      const promises = nonEmptyLinks.map(link =>
        api.post('/uploads/', { google_drive_link: link.trim() })
      );

      await Promise.all(promises);

      setMessage(`Successfully submitted ${nonEmptyLinks.length} document link(s)! They are now being processed.`);
      setMessageType('success');
      setDriveLinks(['']);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'An error occurred while uploading.';
      setMessage(errorMsg);
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: 'linear-gradient(135deg, #4a90e2, #007bff)',
        padding: '40px 20px',
      }}
    >
      <motion.div
        className="bg-white rounded-4 shadow-lg p-4 p-md-5"
        style={{ width: '100%', maxWidth: '800px' }}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.h2
          className="fw-bold text-center mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <i className="bi bi-cloud-arrow-up me-2 text-primary"></i>
          Upload Document Links
        </motion.h2>

        <p className="text-center text-muted mb-4">
          Enter Google Drive links for the documents you want to submit for evaluation.
        </p>

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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <input
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={link}
                onChange={(e) => updateLink(index, e.target.value)}
                className="form-control rounded-3"
                required={driveLinks.length === 1 && index === 0}
              />
              {driveLinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLinkField(index)}
                  className="btn btn-danger rounded-3 px-3"
                >
                  <i className="bi bi-trash3"></i>
                </button>
              )}
            </motion.div>
          ))}

          <div className="d-flex flex-wrap justify-content-between gap-2 mt-4">
            <motion.button
              type="button"
              onClick={addLinkField}
              className="btn btn-outline-primary fw-semibold rounded-3"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="bi bi-plus-circle me-2"></i>Add Another Link
            </motion.button>

            <motion.button
              type="submit"
              className="btn fw-semibold text-white rounded-3"
              disabled={loading}
              style={{
                background: 'linear-gradient(90deg, #007bff, #00bcd4)',
                border: 'none',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Uploading...' : 'Upload Documents'}
            </motion.button>
          </div>
        </motion.form>

        {message && (
          <motion.div
            className={`alert alert-${messageType} mt-4 text-center rounded-3`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {message}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Upload;
