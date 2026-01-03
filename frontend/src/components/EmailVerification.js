import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';


const EmailVerification = () => {
  const { token } = useParams();
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
          setMessage('✅ Email verified successfully! You can now log in.');
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
  }, [token, verifyEmail]);

  if (loading) {
    return (
      <div className="verify-page">
        <motion.div
          className="verify-card shadow-lg"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="spinner"></div>
          <h3 className="mt-3 fw-bold text-gradient">Verifying your email...</h3>
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
        <h2 className="fw-bold  mb-3">Email Verification</h2>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mt-3">
          {message && (
            <Link to="/login" className="btn btn-gradient px-4 py-2 rounded-pill">
              Go to Login
            </Link>
          )}
          {error && (
            <Link to="/" className="btn btn-outline-secondary px-4 py-2 rounded-pill">
              Return to Home
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
