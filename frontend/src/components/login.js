import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotification } from './Notification';
const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotification();

  // Check for redirect message from email verification
  useEffect(() => {
    if (location.state?.message) {
      if (location.state.type === 'success') {
        notify.success(location.state.message);
      } else {
        notify.info(location.state.message);
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, notify]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      notify.error(result.error);
    } else {
      notify.success('Welcome back!');
      navigate('/');
    }

    setLoading(false);
  };

  // Redirect authenticated users to their dashboard
  if (isAuthenticated) {
    return <Navigate to={user?.is_staff ? '/admin-dashboard' : '/faculty-dashboard'} replace />;
  }

  return (
    <div className="login-split-container">
      <div className="login-left-section login-visual-side">
        {/* Visual side only holds the background image now */}
      </div>

      <div className="login-right-section login-form-side">
        <Link to="/" className="login-back-btn">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Home
        </Link>
        <motion.div
          className="login-auth-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="login-header text-center mb-4">
            <div className="login-logo-pnl mx-auto mb-3">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <h2 className="fw-bold text-dark">Welcome Back</h2>
            <p className="text-muted small">Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="mb-3">
              <label className="form-label-custom">Email Address</label>
              <div className="login-input-wrapper">
                <i className="bi bi-envelope login-input-icon"></i>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="login-input-field"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label-custom mb-0">Password</label>
              </div>
              <div className="login-input-wrapper">
                <i className="bi bi-lock login-input-icon"></i>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="login-input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn w-100 mb-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center mt-2 pt-3 border-top">
            <p className="mb-0 text-muted small">
              Don't have an account? <Link to="/faculty-register" className="register-link fw-bold">Create Account</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
