import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotification } from './Notification';
import LoadingOverlay from './LoadingOverlay';
const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('idle');
  const { login, warmupInferenceServices, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotification();
  const handledRedirectSignatureRef = useRef('');

  const redirectMessage = location.state?.message;
  const redirectType = location.state?.type;

  // Check for redirect message from email verification
  useEffect(() => {
    if (!redirectMessage) {
      return;
    }

    const redirectSignature = `${redirectType || 'info'}::${redirectMessage}`;

    if (handledRedirectSignatureRef.current === redirectSignature) {
      return;
    }

    handledRedirectSignatureRef.current = redirectSignature;

    if (redirectType === 'success') {
      notify.success(redirectMessage);
    } else {
      notify.info(redirectMessage);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [redirectMessage, redirectType, location.pathname, navigate, notify]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingPhase('signin');

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      notify.error(result.error);
      setLoading(false);
      setLoadingPhase('idle');
      return;
    }

    notify.success('Welcome back!');

    if (result.user && result.user.is_staff === false) {
      setLoadingPhase('warmup');
      const warmupResult = await warmupInferenceServices();

      if (!warmupResult.success) {
        notify.info('Signed in. AI services will finish loading automatically on first use.');
      }
    }

    navigate('/');
    setLoading(false);
    setLoadingPhase('idle');
  };

  const loadingMessage = loadingPhase === 'warmup'
    ? 'Preparing AI model and OCR engine...'
    : 'Signing in...';

  // Redirect authenticated users to their dashboard (except while login flow is actively running)
  if (isAuthenticated && !loading) {
    return <Navigate to={user?.is_staff ? '/admin-dashboard' : '/faculty-dashboard'} replace />;
  }

  return (
    <>
      {loading && <LoadingOverlay message={loadingMessage} />}
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
                    {loadingPhase === 'warmup' ? 'Preparing AI services...' : 'Signing in...'}
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
    </>
  );
};

export default Login;
