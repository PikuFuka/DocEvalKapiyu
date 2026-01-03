import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';


const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { verifyEmail } = useAuth();

  useEffect(() => {
    let isVerified = false;

    const verify = async () => {
      if (isVerified) return;
      isVerified = true;

      if (!token) {
        setError('Invalid verification link.');
        setLoading(false);
        return;
      }

      try {
        const result = await verifyEmail(token);
        if (result.success) {
          setMessage('✅ Email verified successfully!');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Email verified successfully! You can now log in.',
                type: 'success' 
              }
            });
          }, 3000);
        } else {
          setError(result.error || 'Verification failed. The link may be expired or invalid.');
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError('An unexpected error occurred during verification.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, verifyEmail, navigate]);

  if (loading) {
    return (
      <div className="verify-page">
        <motion.div
          className="verify-card shadow-lg"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="lspu-spinner mb-4">
            <div className="spinner-ring" style={{ borderColor: 'var(--primary-color) transparent transparent transparent' }}></div>
            <div className="spinner-ring" style={{ borderColor: 'var(--primary-light) transparent transparent transparent' }}></div>
            <div className="spinner-ring" style={{ borderColor: 'var(--accent-color) transparent transparent transparent' }}></div>
          </div>
          <h3 className="mt-3 fw-bold" style={{ color: 'var(--primary-color)' }}>Verifying your email...</h3>
          <p className="text-muted">Please wait while we confirm your account.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="verify-page">
      <motion.div
        className="verify-card shadow-lg"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {message && (
          <>
            <div className="success-checkmark mb-3">
              <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem', color: 'var(--success-color)' }}></i>
            </div>
            <h2 className="fw-bold mb-3" style={{ color: 'var(--success-color)' }}>Email Verified!</h2>
            <div className="alert alert-success border-0" style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-dark)' }}>{message}</div>
            <p className="text-muted mt-3">Redirecting to login page...</p>
            <div className="redirect-progress mt-2">
              <motion.div 
                className="progress-bar"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3 }}
                style={{ height: '4px', backgroundColor: 'var(--success-color)', borderRadius: '2px' }}
              />
            </div>
          </>
        )}
        
        {error && (
          <>
            <div className="error-icon mb-3">
              <i className="bi bi-x-circle-fill" style={{ fontSize: '4rem', color: '#dc3545' }}></i>
            </div>
            <h2 className="fw-bold text-danger mb-3">Verification Failed</h2>
            <div className="alert alert-danger">{error}</div>
            <button 
              onClick={() => navigate('/')}
              className="btn mt-3 px-4 py-2"
              style={{ 
                backgroundColor: '#006633', 
                color: 'white',
                borderRadius: '50px'
              }}
            >
              Return to Home
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EmailVerification;
