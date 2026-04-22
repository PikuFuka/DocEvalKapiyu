import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api, { UPLOAD_QUEUE_REQUEST_CONFIG, extractUploadsArray } from '../services/api';
import { UploadCard } from './UploadCard';
import LoadingOverlay from './LoadingOverlay';
import './FacultyDashboard.css';

const FacultyDashboard = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, processing: 0 });
  const [showAll, setShowAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'processing'
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);
  const refreshDashboardRef = useRef(null);

  const handleUploadUpdated = async (isBackground = false) => {
    if (typeof refreshDashboardRef.current === 'function') {
      await refreshDashboardRef.current(isBackground);
    }
  };

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    mountedRef.current = true;

    const fetchDashboardData = async (isBackground = false) => {
      if (fetchingRef.current) {
        return;
      }

      fetchingRef.current = true;

      if (!isBackground && mountedRef.current) {
        setLoading(true);
      }

      try {
        const uploadsResponse = await api.get('/user/uploads/', UPLOAD_QUEUE_REQUEST_CONFIG);
        const data = extractUploadsArray(uploadsResponse.data);

        if (!mountedRef.current) {
          return;
        }

        const forReview = data.filter(u => u.status === 'for_review').length;
        if (forReview > 0) {
          navigateRef.current('/classification-review', { replace: true });
          return;
        }

        const visibleData = data.filter(u => u.status !== 'for_review');

        const total = visibleData.length;
        const completed = visibleData.filter(u => u.status === 'completed').length;
        const processing = visibleData.filter(
          u => u.status === 'processing' || u.status === 'pending'
        ).length;

        // Sort by created_at descending
        const sortedData = [...visibleData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setUploads(sortedData);
        setStats({ total, completed, processing });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (!isBackground && mountedRef.current) {
          setUploads([]);
          setStats({ total: 0, completed: 0, processing: 0 });
        }
      } finally {
        fetchingRef.current = false;
        if (!isBackground && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    refreshDashboardRef.current = fetchDashboardData;

    fetchDashboardData();

    // Poll for updates only when there are processing uploads.
    const interval = setInterval(() => {
      const hasActiveUploads = uploads.some(u => u.status === 'processing' || u.status === 'pending');
      if (hasActiveUploads) {
        fetchDashboardData(true);
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      refreshDashboardRef.current = null;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <LoadingOverlay message="Loading Dashboard..." />;

  const filteredUploads = uploads.filter(upload => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return upload.status === 'completed';
    if (filterStatus === 'processing') {
      return upload.status === 'processing' || upload.status === 'pending';
    }
    return true;
  });

  const displayedUploads = showAll ? filteredUploads : filteredUploads.slice(0, 6);


  const statusOptions = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'processing', label: 'Processing', count: stats.processing }
  ];

  const filterLabels = {
    all: 'all',
    completed: 'completed',
    processing: 'processing'
  };

  const getStatusStyle = (status) => {
    if (status === 'completed') {
      return { className: 'is-completed', icon: 'bi-check-circle-fill', label: 'Completed' };
    }

    if (status === 'processing' || status === 'pending') {
      return {
        className: 'is-processing',
        icon: status === 'processing' ? 'bi-arrow-repeat spin' : 'bi-clock-fill',
        label: status === 'processing' ? 'Processing' : 'Pending'
      };
    }

    return {
      className: 'is-pending',
      icon: 'bi-exclamation-circle-fill',
      label: status || 'Unknown'
    };
  };

  return (
    <div className="faculty-dashboard faculty-dashboard-v2 upload-surface-page min-vh-100 py-5 position-relative overflow-hidden">
      <div className="upload-surface-bg" aria-hidden="true">
        <span className="upload-surface-blob upload-surface-blob-primary"></span>
        <span className="upload-surface-blob upload-surface-blob-success"></span>
        <span className="upload-surface-blob upload-surface-blob-accent"></span>
      </div>

      <div className="container position-relative z-1 dashboard-shell-v2">
        <motion.header 
          className="dashboard-topbar dashboard-topbar-v2 d-flex justify-content-between align-items-end"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="dashboard-heading-cluster">
            <span className="dashboard-kicker">Faculty Workspace</span>
            <h1 className="dashboard-title-v2">Evaluation Dashboard</h1>
            <p className="dashboard-subtitle-v2 mb-0">Track processing progress, review outcomes, and quickly jump back into uploads.</p>
            <span className="dashboard-live-pill mt-3">
              <span className="live-dot" aria-hidden="true"></span>
              Live refresh every 5 seconds
            </span>
          </div>
          <div className="dashboard-topbar-actions d-none d-md-flex gap-2">
            <Link to="/upload" className="btn btn-primary dashboard-action-btn rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2">
              <i className="bi bi-plus-lg"></i>
              <span>New Upload</span>
            </Link>
          </div>
        </motion.header>

        {/* Stats Section */}
        <motion.div
          className="row g-4 mb-5 dashboard-stats-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[
            {
              title: 'Total Uploads',
              value: stats.total,
              icon: 'bi-cloud-arrow-up',
              tone: 'primary'
            },
            {
              title: 'Completed',
              value: stats.completed,
              icon: 'bi-check2-circle',
              tone: 'success'
            },
            {
              title: 'Processing',
              value: stats.processing,
              icon: 'bi-hourglass-split',
              tone: 'warning'
            }
          ].map((stat, idx) => (
            <div key={idx} className="col-12 col-md-4">
              <motion.div 
                className={`card dashboard-metric-card dashboard-metric-card-v2 rounded-4 border-0 shadow-sm h-100 stat-tone-${stat.tone} position-relative overflow-hidden`}
                whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
              >
                {/* Decorative Background Icon */}
                <div className="dashboard-metric-bg-icon position-absolute opacity-10" aria-hidden="true">
                    <i className={`bi ${stat.icon}`}></i>
                </div>

                <div className="card-body p-4 position-relative z-1 d-flex flex-column justify-content-between">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h6 className="dashboard-metric-label mb-0 pt-1">{stat.title}</h6>
                      <span className="dashboard-metric-icon" aria-hidden="true">
                        <i className={`bi ${stat.icon}`}></i>
                      </span>
                    </div>
                    <h2 className="dashboard-metric-value mb-0">{stat.value}</h2>
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>

        {/* Uploads Section */}
        <motion.div
          className="card dashboard-documents-shell dashboard-documents-shell-v2 border border-light shadow-sm rounded-4 overflow-hidden mb-5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="card-header dashboard-documents-header dashboard-documents-header-v2 border-bottom pt-4 px-4 pb-3 d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div className="documents-title-group">
                <h5 className="fw-bold text-dark mb-1">Recent Documents</h5>
                <p className="text-muted small mb-0">Manage submitted files and check status updates in one place.</p>
            </div>
            
            {uploads.length > 0 && (
              <div className="documents-toolbar-v2 d-flex gap-2 align-items-center flex-wrap justify-content-end">
                <div className="view-toggle-v2 btn-group" role="group" aria-label="Select dashboard view mode">
                    <button 
                        type="button" 
                        className={`btn btn-sm rounded-pill px-3 border-0 ${viewMode === 'card' ? 'active' : ''}`}
                        onClick={() => setViewMode('card')}
                        aria-pressed={viewMode === 'card'}
                    >
                        <i className="bi bi-card-list me-1"></i> Cards
                    </button>
                    <button 
                        type="button" 
                        className={`btn btn-sm rounded-pill px-3 border-0 ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        aria-pressed={viewMode === 'list'}
                    >
                        <i className="bi bi-table me-1"></i> Table
                    </button>
                </div>

                <div className="filter-pill-group-v2 d-none d-md-flex" role="group" aria-label="Filter uploads by status">
                  {statusOptions.map((statusOption) => (
                    <button
                        key={statusOption.key}
                        onClick={() => setFilterStatus(statusOption.key)}
                        className={`filter-pill-btn ${filterStatus === statusOption.key ? 'active' : ''}`}
                        aria-pressed={filterStatus === statusOption.key}
                    >
                        <span>{statusOption.label}</span>
                        <span className="count">{statusOption.count}</span>
                    </button>
                  ))}
                </div>

                <div className="filter-select-v2 d-md-none">
                  <label className="form-label mb-1" htmlFor="dashboard-filter">Filter</label>
                  <select
                    id="dashboard-filter"
                    className="form-select form-select-sm"
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                  >
                    {statusOptions.map((statusOption) => (
                      <option key={statusOption.key} value={statusOption.key}>
                        {statusOption.label} ({statusOption.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="card-body dashboard-documents-body dashboard-documents-body-v2 p-4">
            {filteredUploads.length === 0 && filterStatus !== 'all' ? (
               <div className="dashboard-empty-state dashboard-empty-filter text-center py-5">
                 <div className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-light rounded-circle empty-icon-shell">
                   <i className="bi bi-filter-circle fs-3 text-muted"></i>
                 </div>
                 <h6 className="text-muted">No {filterLabels[filterStatus]} documents found</h6>
                 <button className="btn btn-link text-decoration-none fw-bold" onClick={() => setFilterStatus('all')}>Clear Filter</button>
               </div>
            ) : uploads.length === 0 ? (
              <div className="dashboard-empty-state dashboard-empty-initial text-center py-5">
                <div className="mx-auto mb-4 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle empty-upload-shell">
                  <i className="bi bi-cloud-arrow-up fs-1 text-primary"></i>
                </div>
                <h4 className="fw-bold text-dark mb-2">No documents yet</h4>
                <p className="text-muted mb-4">Upload your first document to get started with the evaluation process.</p>
                <Link 
                  to="/upload" 
                  className="btn btn-primary dashboard-upload-cta rounded-pill px-5 py-3 fw-bold shadow-lg hover-scale"
                >
                  <i className="bi bi-plus-circle me-2"></i>Upload Document
                </Link>
              </div>
            ) : (
              <>
                {viewMode === 'card' ? (
                    <div className="row g-3 dashboard-card-grid">
                        {displayedUploads.map(upload => (
                          <div key={upload.id} className="col-12 col-md-6 col-xl-4">
                          <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.3 }}
                          >
                            <UploadCard upload={upload} onUploadUpdated={handleUploadUpdated} showInlineReview={false} />
                          </motion.div>
                          </div>
                        ))}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle dashboard-table-v2 mb-0">
                            <thead>
                                <tr>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold ps-4">Document</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">KRA</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">Criterion</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">Sub-Criterion</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">Date</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold">Status</th>
                                    <th className="border-0 text-secondary small text-uppercase fw-bold text-end pe-4">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedUploads.map(upload => {
                                    const statusStyle = getStatusStyle(upload.status);
                                    const parsedScore = parseFloat(upload.equivalent_percentage || upload.total_score || 0);
                                    const needsManualScoreCheck = parsedScore === 0;

                                    return (
                                    <tr key={upload.id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="dashboard-file-icon rounded-circle bg-primary bg-opacity-10 p-2 text-primary">
                                                    <i className="bi bi-file-earmark-text"></i>
                                                </div>
                                                <div className="fw-bold text-dark document-name-cell" title={upload.source_filename || upload.filename || `Document #${upload.id}`}>
                                                    {upload.source_filename || upload.filename || `Document #${upload.id}`}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-dark small fw-medium">{upload.primary_kra || '-'}</td>
                                        <td className="text-dark small fw-medium">{upload.criteria || '-'}</td>
                                        <td className="text-dark small fw-medium">
                                            <div className="text-truncate" style={{ maxWidth: '220px' }} title={upload.sub_criteria}>
                                                {upload.sub_criteria || '-'}
                                            </div>
                                        </td>
                                        <td className="text-secondary small fw-medium">
                                            {new Date(upload.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span className={`dashboard-status-badge ${statusStyle.className}`}>
                                                <i className={`bi ${statusStyle.icon} me-1`}></i>
                                                {statusStyle.label}
                                            </span>
                                        </td>
                                        <td className="text-end pe-4">
                                            {upload.status === 'completed' ? (
                                                needsManualScoreCheck ? (
                                                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Need Manual Check</span>
                                                ) : (
                                                    <span className="fw-bold text-dark dashboard-score-value">{upload.equivalent_percentage || upload.total_score}</span>
                                                )
                                            ) : (
                                                <span className="text-secondary">-</span>
                                            )}
                                        </td>
                                    </tr>
                                )})}
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
                  className="btn dashboard-show-all-btn rounded-pill px-5 py-2 fw-bold"
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
