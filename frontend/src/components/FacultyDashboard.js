import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { UploadCard } from './UploadCard';
import LoadingOverlay from './LoadingOverlay';

const FacultyDashboard = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const uploadsResponse = await api.get('/user/uploads/');
      const data = uploadsResponse.data;

      const total = data.length;
      const completed = data.filter(u => u.status === 'completed').length;
      const pending = total - completed;

      setUploads(data);
      setStats({ total, completed, pending });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingOverlay message="Loading Faculty Evaluation Dashboard..." />;

  const displayedUploads = showAll ? uploads : uploads.slice(0, 6);

  return (
    <div className="dashboard py-5" style={{ backgroundColor: '#f8f9fc' }}>
      <div className="container">
        {/* Header */}
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="fw-bold mb-2">Faculty Dashboard</h1>
          <p className="text-muted fs-5">Monitor your uploads and evaluation progress</p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="row justify-content-center mb-5 g-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="col-md-4">
            <div className="stat-card shadow-sm rounded-4 text-center p-4 bg-white">
              <h2 className="fw-bold">{stats.total}</h2>
              <p className="text-muted">Total Uploads</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card shadow-sm rounded-4 text-center p-4 bg-white">
              <h2 className="fw-bold">{stats.completed}</h2>
              <p className="text-muted">Completed</p>
            </div>
          </div>

        </motion.div>

        {/* Uploads Section */}
        <motion.div
          className="card border-0 shadow-lg rounded-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div
            className="card-header text-white py-3"
            style={{ background: 'linear-gradient(135deg, #4e54c8, #8f94fb)' }}
          >
            <h2 className="card-title fw-bold text-center mb-0">
              <i className="bi bi-clipboard-data me-2"></i>Your Recent Uploads
            </h2>
          </div>
          <div className="card-body p-4">
            {uploads.length === 0 ? (
              <div className="alert alert-info text-center">
                You haven't uploaded any documents yet.{' '}
                <a href="/upload" className="text-primary fw-bold">Upload your first document</a>.
              </div>
            ) : (
              <div className="uploads-grid">
                {displayedUploads.map(upload => (
                  <motion.div
                    key={upload.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <UploadCard upload={upload} />
                  </motion.div>
                ))}
              </div>
            )}
            {uploads.length > 6 && (
              <div className="text-center mt-4">
                <button 
                  onClick={() => setShowAll(!showAll)} 
                  className="btn btn-gradient rounded-pill px-4 py-2"
                >
                  {showAll ? 'Show Less' : `View All ${uploads.length} Uploads`}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
