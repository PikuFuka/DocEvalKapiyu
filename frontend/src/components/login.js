import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotification } from './Notification';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
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
    setError('');

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setError(result.error);
      notify.error(result.error);
    } else {
      notify.success('Welcome back!');
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page min-vh-100 d-flex align-items-center justify-content-center py-5 position-relative overflow-hidden" style={{ background: '#f8f9fa' }}>
      {/* Background Shapes */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="position-absolute top-0 end-0 bg-primary opacity-10 rounded-circle blur-3xl" style={{ width: '600px', height: '600px', transform: 'translate(30%, -30%)' }}></div>
        <div className="position-absolute bottom-0 start-0 bg-info opacity-10 rounded-circle blur-3xl" style={{ width: '500px', height: '500px', transform: 'translate(-30%, 30%)' }}></div>
      </div>

      <motion.div
        className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white position-relative z-1"
        style={{ width: '100%', maxWidth: '450px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card-header bg-white border-0 pt-5 pb-0 text-center">
          <div 
            className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-primary bg-gradient text-white rounded-circle shadow-sm"
            style={{ width: '64px', height: '64px' }}
          >
            <i className="bi bi-person-fill fs-2"></i>
          </div>
          <h3 className="fw-bold text-dark mb-3">Welcome Back</h3>
          <p className="text-muted mb-4">Sign in to your account</p>
        </div>

        <div className="card-body p-4 p-md-5 pt-3">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted text-uppercase">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-envelope"></i></span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control bg-light border-start-0 py-2"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-bold text-muted text-uppercase mb-0">Password</label>
              </div>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-lock"></i></span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control bg-light border-start-0 py-2"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-bold rounded-3 shadow-sm mb-3"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center mt-4 pt-3 border-top">
            <p className="text-muted small mb-0">
              Don't have an account?{' '}
              <Link to="/faculty-register" className="text-primary fw-bold text-decoration-none">Create account</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
