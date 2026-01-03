import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // ✅ Ensure dropdown JS works

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Ensure dropdown works after component mounts
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
      <div className="container">
        {/* Brand */}
        <Link
          to="/"
          className="navbar-brand fw-bold d-flex align-items-center"
          style={{ color: '#1E88E5' }}
        >
          <i className="bi bi-mortarboard-fill me-2"></i>
          DocEvalKapiyu
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navContent"
          aria-controls="navContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Links */}
        <div className="collapse navbar-collapse" id="navContent">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active fw-semibold text-primary' : ''}`}
              >
                Home
              </Link>
            </li>

            {/* Faculty User Links */}
            {isAuthenticated && user?.is_staff === false && (
              <>
                <li className="nav-item">
                  <Link
                    to="/upload"
                    className={`nav-link ${isActive('/upload') ? 'active fw-semibold text-primary' : ''}`}
                  >
                    Upload
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/faculty-dashboard"
                    className={`nav-link ${isActive('/faculty-dashboard') ? 'active fw-semibold text-primary' : ''}`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                <Link
                  to="/analytics"
                  className={`nav-link ${isActive('/analytics') ? 'active fw-semibold text-primary' : ''}`}
                >
                  Gap Analysis
                </Link>
              </li>
              </>
            )}

            {/* Admin Links */}
            {isAuthenticated && user?.is_staff === true && (
              <li className="nav-item">
                <Link
                  to="/admin-dashboard"
                  className={`nav-link ${isActive('/admin-dashboard') ? 'active fw-semibold text-primary' : ''}`}
                >
                  Admin Dashboard
                </Link>
              </li>
            )}

            {/* About */}
            <li className="nav-item">
              <Link
                to="/about"
                className={`nav-link ${isActive('/about') ? 'active fw-semibold text-primary' : ''}`}
              >
                About
              </Link>
            </li>

            {/* Authenticated User Dropdown */}
            {isAuthenticated ? (
              <li className="nav-item dropdown ms-lg-3 mt-2 mt-lg-0">
                <button
                  className="btn btn-light dropdown-toggle d-flex align-items-center border"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle me-2 text-primary fs-5"></i>
                  <span className="fw-semibold text-dark"> {user.first_name}
                  </span>
                </button>

                <ul
                  className="dropdown-menu dropdown-menu-end shadow-sm"
                  aria-labelledby="userDropdown"
                >
                  <li>
                  </li>
                  <li>
                    <button
                      onClick={logout}
                      className="dropdown-item text-danger d-flex align-items-center"
                    >
                      <i className="bi bi-box-arrow-right me-2"></i> Logout
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
                <Link to="/login" className="btn btn-primary">
                  <i className="bi bi-person-circle me-2"></i>
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
