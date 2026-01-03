import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import LoadingOverlay from "./LoadingOverlay";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total_faculty: 0, total_documents: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/admin/stats/"),
        api.get("/admin/users/"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewUserDocuments = async (userId) => {
    try {
      const response = await api.get(`/admin/user/${userId}/documents/`);
      setSelectedUser(response.data);
    } catch (error) {
      console.error("Error fetching user documents:", error);
    }
  };

  const closeModal = () => setSelectedUser(null);

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <LoadingOverlay message="Loading Admin Dashboard..." />;
  }

  return (
    <div
      className="dashboard py-5 position-relative overflow-hidden"
      style={{
        background: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      {/* Background Shapes */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="position-absolute top-0 end-0 bg-primary opacity-10 rounded-circle blur-3xl" style={{ width: '600px', height: '600px', transform: 'translate(30%, -30%)' }}></div>
        <div className="position-absolute bottom-0 start-0 bg-info opacity-10 rounded-circle blur-3xl" style={{ width: '500px', height: '500px', transform: 'translate(-30%, 30%)' }}></div>
      </div>

      <div className="container position-relative z-1">
        {/* Header */}
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="d-inline-flex align-items-center justify-content-center bg-white p-3 rounded-circle shadow-sm mb-3">
            <i className="bi bi-shield-lock-fill fs-2 text-primary"></i>
          </div>
          <h1 className="fw-bold mb-2 text-dark">Admin Dashboard</h1>
          <p className="text-muted">Monitor faculty statistics and document evaluations</p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="row justify-content-center mb-5 g-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
              <div className="card-body p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small text-uppercase fw-bold mb-1">Total Faculty</p>
                  <h2 className="fw-bold mb-0 text-dark">{stats.total_faculty}</h2>
                </div>
                <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
                  <i className="bi bi-people-fill fs-3"></i>
                </div>
              </div>
              <div className="card-footer bg-light border-0 py-2 px-4">
                <small className="text-muted"><i className="bi bi-arrow-up-right text-success me-1"></i> Active Users</small>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
              <div className="card-body p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small text-uppercase fw-bold mb-1">Documents Processed</p>
                  <h2 className="fw-bold mb-0 text-dark">{stats.total_documents}</h2>
                </div>
                <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle">
                  <i className="bi bi-file-earmark-check-fill fs-3"></i>
                </div>
              </div>
              <div className="card-footer bg-light border-0 py-2 px-4">
                <small className="text-muted"><i className="bi bi-clock-history text-primary me-1"></i> All time</small>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Users Section */}
        <motion.div
          className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div className="card-header bg-white border-bottom py-4 px-4 d-flex justify-content-between align-items-center">
            <h4 className="fw-bold mb-0 text-dark">Faculty Users</h4>
            <div className="input-group" style={{ maxWidth: '300px' }}>
              <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
              <input 
                type="text" 
                className="form-control bg-light border-start-0" 
                placeholder="Search faculty..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="card-body p-4 bg-light bg-opacity-50">
            {filteredUsers.length > 0 ? (
              <div className="row g-4">
                {filteredUsers.map((user, i) => (
                  <motion.div
                    key={user.id}
                    className="col-md-6 col-lg-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <div className="card border-0 shadow-sm rounded-4 h-100 hover-shadow transition-all">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-primary bg-gradient text-white rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0 text-dark">{user.first_name} {user.last_name}</h6>
                            <small className="text-muted">{user.email}</small>
                          </div>
                        </div>
                        
                        <div className="border-top pt-3 mt-3">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Joined</span>
                            <span className="fw-medium small">{new Date(user.date_joined).toLocaleDateString()}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Uploads</span>
                            <span className="badge bg-light text-dark border">{user.total_uploads}</span>
                          </div>
                          {user.faculty_profile?.sheet_url && (
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted small">Sheet</span>
                              <a href={user.faculty_profile.sheet_url} target="_blank" rel="noopener noreferrer" className="small text-decoration-none">View <i className="bi bi-box-arrow-up-right ms-1"></i></a>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => viewUserDocuments(user.id)}
                          className="btn btn-outline-primary w-100 mt-3 rounded-3 fw-medium btn-sm"
                        >
                          View Documents
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="mb-3 text-muted opacity-25">
                  <i className="bi bi-people fs-1"></i>
                </div>
                <h5 className="text-muted">No faculty users found</h5>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
        }
        .transition-all {
          transition: all 0.3s ease;
        }
      `}</style>

      {/* Modal */}
      {selectedUser && (
        <div
          className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 1050,
          }}
          onClick={closeModal}
        >
          <motion.div
            className="bg-white rounded-4 shadow-lg"
            style={{ 
              maxWidth: "600px", 
              width: "90%",
              maxHeight: "80vh", // Set maximum height
            }}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Modal Header */}
            <div className="modal-header border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <h4
                className="fw-bold mb-0"
                style={{
                  background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Documents for {selectedUser.user_name}
              </h4>
              <button
                type="button"
                className="btn-close"
                onClick={closeModal}
                aria-label="Close"
              ></button>
            </div>

            {/* Modal Body - Scrollable Content */}
            <div 
              className="modal-body px-4 pb-4" 
              style={{ 
                maxHeight: "calc(80vh - 120px)", // Account for header/footer
                overflowY: "auto" // Enable vertical scrolling
              }}
            >
              {selectedUser.uploads.length > 0 ? (
                <div className="documents-list">
                  {selectedUser.uploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="border rounded-3 p-3 mb-3 shadow-sm bg-light"
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">Document #{upload.id}</h6>
                        <span className={`badge ${
                          upload.status === 'completed' ? 'bg-success' :
                          upload.status === 'failed' ? 'bg-danger' :
                          upload.status === 'processing' ? 'bg-warning' :
                          'bg-secondary'
                        }`}>
                          {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                        </span>
                      </div>
                      
                      <p className="mb-1">
                        <strong>Upload Date:</strong>{" "}
                        {new Date(upload.created_at).toLocaleString()}
                      </p>
                      
                      {upload.google_sheet_link && (
                        <p className="mb-2">
                          <a
                            href={upload.google_sheet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-decoration-none"
                          >
                            <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                            View Document Sheet
                          </a>
                        </p>
                      )}
                      
                      <p className="text-truncate mb-0">
                        <strong>Drive Link:</strong>{" "}
                        <a
                          href={upload.google_drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                        >
                          {upload.google_drive_link}
                        </a>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-file-earmark-x fs-1 text-muted mb-3"></i>
                  <p className="mb-0">No documents uploaded by this user.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer border-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-secondary w-100"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;