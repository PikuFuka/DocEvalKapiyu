import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { UploadCard } from './UploadCard';
import LoadingOverlay from './LoadingOverlay';

const FacultyDashboard = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, processing: 0, forReview: 0 });
  const [showAll, setShowAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'review', 'processing'
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'

  useEffect(() => {
    fetchDashboardData();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const uploadsResponse = await api.get('/user/uploads/');
      const data = uploadsResponse.data;

      const total = data.length;
      const completed = data.filter(u => u.status === 'completed').length;
      const forReview = data.filter(u => u.status === 'for_review').length;
      const processing = data.filter(
        u => u.status === 'processing' || u.status === 'pending'
      ).length;

      // Sort by created_at descending
      const sortedData = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setUploads(sortedData);
      setStats({ total, completed, processing, forReview });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  if (loading) return <LoadingOverlay message="Loading Dashboard..." />;

  const filteredUploads = uploads.filter(upload => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return upload.status === 'completed';
    if (filterStatus === 'review') return upload.status === 'for_review';
    if (filterStatus === 'processing') {
      return upload.status === 'processing' || upload.status === 'pending';
    }
    return true;
  });

  const displayedUploads = showAll ? filteredUploads : filteredUploads.slice(0, 6);

  return (
    <div className="faculty-dashboard min-vh-100 py-5 position-relative overflow-hidden" style={{ background: '#f1f5f9' }}>
      {/* Ambient Background */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="position-absolute top-0 end-0 rounded-circle blur-3xl opacity-20" style={{ width: '800px', height: '800px', background: '#4f46e5', transform: 'translate(30%, -30%)' }}></div>
        <div className="position-absolute bottom-0 start-0 rounded-circle blur-3xl opacity-20" style={{ width: '600px', height: '600px', background: '#06b6d4', transform: 'translate(-30%, 30%)' }}></div>
      </div>

      <div className="container position-relative z-1">
        <motion.header 
          className="mb-5 d-flex justify-content-between align-items-end"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-1px' }}>Faculty Dashboard</h1>
            <p className="text-secondary mb-0">Track your document evaluations and performance metrics.</p>
          </div>
          <div className="d-none d-md-flex gap-2">
            {stats.forReview > 0 && (
              <a href="/classification-review" className="btn btn-warning rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2">
                <i className="bi bi-check2-square"></i>
                <span>Review Queue ({stats.forReview})</span>
              </a>
            )}
            <a href="/upload" className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2">
                <i className="bi bi-plus-lg"></i>
                <span>New Upload</span>
            </a>
          </div>
        </motion.header>

        {/* Stats Section */}
        <motion.div
          className="row g-4 mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[
            { title: 'Total Uploads', value: stats.total, icon: 'bi-cloud-upload', color: 'primary', bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', text: '#3730a3' },
            { title: 'Completed', value: stats.completed, icon: 'bi-check-circle', color: 'success', bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', text: '#166534' },
            { title: 'For Review', value: stats.forReview, icon: 'bi-check2-square', color: 'warning', bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', text: '#9f1239' },
            { title: 'Processing', value: stats.processing, icon: 'bi-hourglass-split', color: 'warning', bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', text: '#92400e' }
          ].map((stat, idx) => (
            <div key={idx} className="col-12 col-sm-6 col-lg-3">
              <motion.div 
                className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative"
                whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                style={{ background: 'white' }}
              >
                <div className="card-body p-4 d-flex align-items-center justify-content-between position-relative z-1">
                    <div>
                        <h6 className="text-secondary fw-bold text-uppercase small mb-1" style={{ letterSpacing: '0.5px' }}>{stat.title}</h6>
                        <h2 className="fw-bold mb-0 text-dark">{stat.value}</h2>
                    </div>
                    <div 
                        className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: '60px', height: '60px', background: stat.bg, color: stat.text }}
                    >
                        <i className={`bi ${stat.icon} fs-4`}></i>
                    </div>
                </div>
                {/* Decorative bg blob */}
                <div className="position-absolute bottom-0 start-0 w-100 h-50 opacity-10" style={{ background: stat.bg, filter: 'blur(20px)', transform: 'translateY(20%)' }}></div>
              </motion.div>
            </div>
          ))}
        </motion.div>

        {/* Uploads Section */}
        <motion.div
          className="card border-0 shadow-lg rounded-5 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}
        >
          <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2 d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
                <h5 className="fw-bold text-dark mb-1">Recent Documents</h5>
                <p className="text-secondary small mb-0">Manage and track your submitted files</p>
            </div>
            
            {uploads.length > 0 && (
              <div className="d-flex gap-2 align-items-center">
                <div className="btn-group bg-light rounded-pill p-1 me-2" role="group">
                    <button 
                        type="button" 
                        className={`btn btn-sm rounded-pill px-3 border-0 ${viewMode === 'card' ? 'bg-white shadow-sm fw-bold text-primary' : 'text-muted'}`}
                        onClick={() => setViewMode('card')}
                    >
                        <i className="bi bi-card-list me-1"></i> Cards
                    </button>
                    <button 
                        type="button" 
                        className={`btn btn-sm rounded-pill px-3 border-0 ${viewMode === 'list' ? 'bg-white shadow-sm fw-bold text-primary' : 'text-muted'}`}
                        onClick={() => setViewMode('list')}
                    >
                        <i className="bi bi-table me-1"></i> Table
                    </button>
                </div>

                <div className="d-none d-md-flex gap-2">
                {['all', 'completed', 'review', 'processing'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`btn btn-sm rounded-pill px-3 fw-bold ${filterStatus === status ? 'btn-dark' : 'btn-light text-secondary'}`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
                </div>
              </div>
            )}
          </div>

          <div className="card-body p-4">

            {stats.forReview > 0 && (
              <div className="alert alert-warning border-0 rounded-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div className="small text-dark mb-0">
                  <strong>{stats.forReview}</strong> classification {stats.forReview === 1 ? 'result is' : 'results are'} waiting for confirmation.
                </div>
                <a href="/classification-review" className="btn btn-sm btn-dark rounded-pill px-3 fw-bold">
                  Open Review Page
                </a>
              </div>
            )}
            
            {/* AI Disclaimer */}
            {uploads.length > 0 && (
              <div className="alert alert-light border border-light shadow-sm rounded-4 mb-4 d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-robot text-primary"></i>
                </div>
                <div className="small text-secondary">
                  <strong>Note:</strong> Please review all evaluation results carefully. While our system is accurate, AI-generated analysis may occasionally contain errors and should be verified.
                </div>
              </div>
            )}

            {filteredUploads.length === 0 && filterStatus !== 'all' ? (
               <div className="text-center py-5">
                 <div className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-light rounded-circle" style={{ width: '60px', height: '60px' }}>
                   <i className="bi bi-filter-circle fs-3 text-muted"></i>
                 </div>
                 <h6 className="text-muted">No documents found with status "{filterStatus}"</h6>
                 <button className="btn btn-link text-decoration-none fw-bold" onClick={() => setFilterStatus('all')}>Clear Filter</button>
               </div>
            ) : uploads.length === 0 ? (
              <div className="text-center py-5">
                <div 
                  className="mx-auto mb-4 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle"
                  style={{ width: '100px', height: '100px' }}
                >
                  <i className="bi bi-cloud-arrow-up fs-1 text-primary"></i>
                </div>
                <h4 className="fw-bold text-dark mb-2">No documents yet</h4>
                <p className="text-muted mb-4">Upload your first document to get started with the evaluation process.</p>
                <a 
                  href="/upload" 
                  className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-lg hover-scale"
                >
                  <i className="bi bi-plus-circle me-2"></i>Upload Document
                </a>
              </div>
            ) : (
              <>
                {viewMode === 'card' ? (
                    <div className="d-flex flex-column gap-3">
                        {displayedUploads.map(upload => (
                        <motion.div
                            key={upload.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3 }}
                        >
                          <UploadCard upload={upload} onUploadUpdated={fetchDashboardData} showInlineReview={false} />
                        </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold ps-4">Document</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">KRA</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">Criterion</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">Sub-Criterion</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">Date</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">Status</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedUploads.map(upload => (
                                    <tr key={upload.id} style={{ cursor: 'pointer' }}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="rounded-circle bg-primary bg-opacity-10 p-2 text-primary">
                                                    <i className="bi bi-file-earmark-text"></i>
                                                </div>
                                                <div className="fw-bold text-dark">
                                                    {upload.source_filename || upload.filename || `Document #${upload.id}`}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-dark small fw-medium">{upload.primary_kra || '-'}</td>
                                        <td className="text-dark small fw-medium">{upload.criteria || '-'}</td>
                                        <td className="text-dark small fw-medium">
                                            <div className="text-truncate" style={{ maxWidth: '200px' }} title={upload.sub_criteria}>
                                                {upload.sub_criteria || '-'}
                                            </div>
                                        </td>
                                        <td className="text-secondary small fw-medium">
                                            {new Date(upload.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span className={`badge rounded-pill px-3 py-2 ${
                                                upload.status === 'completed' ? 'bg-success bg-opacity-10 text-success' :
                                            upload.status === 'for_review' ? 'bg-info bg-opacity-10 text-info' :
                                                upload.status === 'processing' ? 'bg-warning bg-opacity-10 text-warning' :
                                                'bg-secondary bg-opacity-10 text-secondary'
                                            }`}>
                                                {upload.status === 'completed' ? <i className="bi bi-check-circle-fill me-1"></i> : 
                                             upload.status === 'for_review' ? <i className="bi bi-eye-fill me-1"></i> :
                                                 upload.status === 'processing' ? <i className="bi bi-arrow-repeat me-1 spin"></i> : 
                                                 <i className="bi bi-clock-fill me-1"></i>}
                                                {upload.status}
                                            </span>
                                        </td>
                                        <td>
                                            {upload.status === 'completed' ? (
                                                (parseFloat(upload.equivalent_percentage || upload.total_score) === 0) ? (
                                                    <span className="badge bg-warning text-dark">Need Manual Checking</span>
                                                ) : (
                                                    <span className="fw-bold text-dark">{upload.equivalent_percentage || upload.total_score}</span>
                                                )
                                            ) : (
                                                <span className="text-secondary">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
              </>
            )}
            
            {uploads.length > 6 && (
              <div className="text-center mt-5">
                <button 
                  onClick={() => setShowAll(!showAll)} 
                  className="btn btn-outline-dark rounded-pill px-5 py-2 fw-bold"
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
