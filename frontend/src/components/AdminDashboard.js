import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total_faculty: 0, total_documents: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dashboard py-5"
      style={{
        background: "linear-gradient(135deg, #eef2ff, #f8f9fc)",
        minHeight: "100vh",
      }}
    >
      <div className="container">
        {/* Header */}
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="fw-bold mb-3"
            style={{
              background: "linear-gradient(90deg, #4e54c8, #8f94fb)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Admin Dashboard
          </h1>
          <p className="text-muted fs-5">
            Monitor faculty statistics and document evaluations
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="row justify-content-center mb-5 g-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="col-md-4">
            <div className="bg-white rounded-4 shadow-sm text-center p-4 h-100">
              <h2 className="fw-bold">{stats.total_faculty}</h2>
              <p className="text-muted mb-0">Total Faculty Users</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="bg-white rounded-4 shadow-sm text-center p-4 h-100">
              <h2 className="fw-bold">{stats.total_documents}</h2>
              <p className="text-muted mb-0">Total Documents Processed</p>
            </div>
          </div>
        </motion.div>

        {/* Users Section */}
        <motion.div
          className="card border-0 shadow-lg rounded-4 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div
            className="card-header text-white text-center py-3"
            style={{
              background: "linear-gradient(135deg, #4e54c8, #8f94fb)",
            }}
          >
            <h2 className="fw-bold mb-0">Faculty Users</h2>
          </div>
          <div className="card-body p-4">
            {users.length > 0 ? (
              <div className="row g-4">
                {users.map((user, i) => (
                  <motion.div
                    key={user.id}
                    className="col-md-6 col-lg-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <div
                      className="p-4 rounded-4 shadow-sm bg-white d-flex flex-column justify-content-between h-100"
                      style={{ minHeight: "280px" }}
                    >
                      <div>
                        <h5
                          className="fw-bold mb-2"
                          style={{
                            background:
                              "linear-gradient(90deg, #4e54c8, #8f94fb)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {user.first_name} {user.last_name}
                        </h5>
                        <p className="mb-1">
                          <strong>Email:</strong> {user.email}
                        </p>
                        <p className="mb-1">
                          <strong>Joined:</strong>{" "}
                          {new Date(user.date_joined).toLocaleDateString()}
                        </p>
                        <p className="mb-2">
                          <strong>Uploads:</strong> {user.total_uploads}
                        </p>

                        {user.faculty_profile?.sheet_url && (
                          <p className="mb-2">
                            <strong>Sheet:</strong>{" "}
                            <a
                              href={user.faculty_profile.sheet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-decoration-none"
                            >
                              View Google Sheet
                            </a>
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => viewUserDocuments(user.id)}
                        className="btn text-white fw-semibold mt-3 rounded-pill"
                        style={{
                          background:
                            "linear-gradient(135deg, #4e54c8, #8f94fb)",
                          border: "none",
                        }}
                      >
                        View Documents
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted mt-4">
                No faculty users found.
              </p>
            )}
          </div>
        </motion.div>
      </div>

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