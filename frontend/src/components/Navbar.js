import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from './Notification';
import { motion } from 'framer-motion';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notify } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Don't show Navbar on Login or Register pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/faculty-register';

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (isAuthPage) return; // Exit if on auth page
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    logout();
    notify.success('Logged out successfully');
    navigate('/');
    setLoggingOut(false);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return '';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    return user.email?.split('@')[0] || 'User';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) return user.first_name[0].toUpperCase();
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  if (isAuthPage) return null;

  return (
    <motion.nav 
      className={`navbar navbar-expand-lg fixed-top ${scrolled ? 'navbar-scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'white',
        boxShadow: scrolled ? 'var(--shadow-md)' : '0 1px 3px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease'
      }}
    >
      {loggingOut && (
        <motion.div 
          className="position-absolute bottom-0 start-0 bg-danger"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ height: '3px', zIndex: 10000 }}
        />
      )}
      <div className="container">
        {/* Brand */}
        <Link
          to="/"
          className="navbar-brand fw-bold d-flex align-items-center"
          style={{ color: 'var(--primary-color)' }}
        >
          <div className="brand-logo me-2 shadow-sm" style={{
            width: '36px',
            height: '36px',
            backgroundColor: '#0d6efd',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.1rem'
          }}>
            <i className="bi bi-mortarboard-fill"></i>
          </div>
          <span style={{ letterSpacing: '-0.5px' }}>DocEval<span style={{ color: 'var(--accent-color)' }}>Kapiyu</span></span>
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
                className={`nav-link px-3 ${isActive('/') ? 'active' : ''}`}
                style={{
                  color: isActive('/') ? '#006633' : '#555',
                  fontWeight: isActive('/') ? '600' : '500',
                  position: 'relative'
                }}
              >
                Home
                {isActive('/') && <span className="nav-indicator"></span>}
              </Link>
            </li>

            {/* Faculty User Links */}
            {isAuthenticated && user?.is_staff === false && (
              <>
                <li className="nav-item">
                  <Link
                    to="/upload"
                    className={`nav-link px-3 ${isActive('/upload') ? 'active' : ''}`}
                    style={{
                      color: isActive('/upload') ? '#006633' : '#555',
                      fontWeight: isActive('/upload') ? '600' : '500'
                    }}
                  >
                    Upload
                    {isActive('/upload') && <span className="nav-indicator"></span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/faculty-dashboard"
                    className={`nav-link px-3 ${isActive('/faculty-dashboard') ? 'active' : ''}`}
                    style={{
                      color: isActive('/faculty-dashboard') ? '#006633' : '#555',
                      fontWeight: isActive('/faculty-dashboard') ? '600' : '500'
                    }}
                  >
                    Dashboard
                    {isActive('/faculty-dashboard') && <span className="nav-indicator"></span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/classification-review"
                    className={`nav-link px-3 ${isActive('/classification-review') ? 'active' : ''}`}
                    style={{
                      color: isActive('/classification-review') ? '#006633' : '#555',
                      fontWeight: isActive('/classification-review') ? '600' : '500'
                    }}
                  >
                    Review
                    {isActive('/classification-review') && <span className="nav-indicator"></span>}
                  </Link>
                </li>
                <li className="nav-item">
                <Link
                  to="/analytics"
                  className={`nav-link px-3 ${isActive('/analytics') ? 'active' : ''}`}
                  style={{
                    color: isActive('/analytics') ? '#006633' : '#555',
                    fontWeight: isActive('/analytics') ? '600' : '500'
                  }}
                >
                  Gap Analysis
                  {isActive('/analytics') && <span className="nav-indicator"></span>}
                </Link>
              </li>
              </>
            )}

            {/* Admin Links */}
            {isAuthenticated && user?.is_staff === true && (
              <li className="nav-item">
                <Link
                  to="/admin-dashboard"
                  className={`nav-link px-3 ${isActive('/admin-dashboard') ? 'active' : ''}`}
                  style={{
                    color: isActive('/admin-dashboard') ? '#006633' : '#555',
                    fontWeight: isActive('/admin-dashboard') ? '600' : '500'
                  }}
                >
                  Admin Dashboard
                  {isActive('/admin-dashboard') && <span className="nav-indicator"></span>}
                </Link>
              </li>
            )}

            {/* About */}
            <li className="nav-item">
              <Link
                to="/about"
                className={`nav-link px-3 ${isActive('/about') ? 'active' : ''}`}
                style={{
                  color: isActive('/about') ? '#006633' : '#555',
                  fontWeight: isActive('/about') ? '600' : '500'
                }}
              >
                About
                {isActive('/about') && <span className="nav-indicator"></span>}
              </Link>
            </li>

            {/* Authenticated User Dropdown */}
            {isAuthenticated ? (
              <li className="nav-item dropdown ms-lg-3 mt-2 mt-lg-0">
                <button
                  className="btn user-dropdown-btn d-flex align-items-center"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{
                    background: 'linear-gradient(135deg, #006633, #008844)',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '6px 16px 6px 6px',
                    color: 'white'
                  }}
                >
                  <div 
                    className="user-avatar me-2"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#FFD700',
                      color: '#006633',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    {getUserInitials()}
                  </div>
                  <span className="fw-medium d-none d-md-inline" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getUserDisplayName()}
                  </span>
                  <i className="bi bi-chevron-down ms-1" style={{ fontSize: '0.7rem' }}></i>
                </button>

                <ul
                  className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2"
                  aria-labelledby="userDropdown"
                  style={{ borderRadius: '12px', minWidth: '220px' }}
                >
                  <li className="px-3 py-2 border-bottom">
                    <div className="d-flex align-items-center">
                      <div 
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#006633',
                          color: '#FFD700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}
                      >
                        {getUserInitials()}
                      </div>
                      <div className="ms-2">
                        <div className="fw-semibold" style={{ color: '#006633' }}>{getUserDisplayName()}</div>
                        <small className="text-muted">{user?.email}</small>
                      </div>
                    </div>
                  </li>
                  <li className="pt-2">
                    <button
                      onClick={handleLogout}
                      className="dropdown-item d-flex align-items-center py-2 text-danger"
                      style={{ borderRadius: '8px', margin: '0 8px', width: 'calc(100% - 16px)' }}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i> Sign Out
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
                <Link 
                  to="/login" 
                  className="btn px-4"
                  style={{
                    background: 'linear-gradient(135deg, #006633, #008844)',
                    color: 'white',
                    borderRadius: '50px',
                    fontWeight: '500',
                    border: 'none'
                  }}
                >
                  <i className="bi bi-person-circle me-2"></i>
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
