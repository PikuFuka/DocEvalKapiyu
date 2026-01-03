import React from 'react';
import { motion } from 'framer-motion';

const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div 
      className="loading-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(5px)'
      }}
    >
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Modern Blue Spinner */}
        <div className="lspu-spinner mb-4">
          <div className="spinner-ring" style={{ borderColor: 'var(--primary-color) transparent transparent transparent' }}></div>
          <div className="spinner-ring" style={{ borderColor: 'var(--primary-light) transparent transparent transparent' }}></div>
          <div className="spinner-ring" style={{ borderColor: 'var(--accent-color) transparent transparent transparent' }}></div>
        </div>
        
        <motion.div 
          className="loading-message fw-medium"
          style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.div>
        
        <motion.div 
          className="loading-dots mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="dot" style={{ animationDelay: '0s' }}>.</span>
          <span className="dot" style={{ animationDelay: '0.2s' }}>.</span>
          <span className="dot" style={{ animationDelay: '0.4s' }}>.</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingOverlay;


