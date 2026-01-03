import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = {
    success: (msg, duration) => addNotification(msg, 'success', duration),
    error: (msg, duration) => addNotification(msg, 'error', duration),
    warning: (msg, duration) => addNotification(msg, 'warning', duration),
    info: (msg, duration) => addNotification(msg, 'info', duration),
  };

  return (
    <NotificationContext.Provider value={{ notify, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, onClose }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-x-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      default: return 'bi-info-circle-fill';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'success': return { bg: '#d4edda', border: '#006633', text: '#006633', icon: '#006633' };
      case 'error': return { bg: '#f8d7da', border: '#dc3545', text: '#721c24', icon: '#dc3545' };
      case 'warning': return { bg: '#fff3cd', border: '#FFD700', text: '#856404', icon: '#FFD700' };
      default: return { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460', icon: '#17a2b8' };
    }
  };

  return (
    <div className="notification-container">
      <AnimatePresence>
        {notifications.map((notification) => {
          const colors = getColor(notification.type);
          return (
            <motion.div
              key={notification.id}
              className="notification-item"
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                backgroundColor: colors.bg,
                borderLeft: `4px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              <i className={`bi ${getIcon(notification.type)} me-2`} style={{ color: colors.icon }}></i>
              <span className="notification-message">{notification.message}</span>
              <button 
                className="notification-close"
                onClick={() => onClose(notification.id)}
                style={{ color: colors.text }}
              >
                <i className="bi bi-x"></i>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationProvider;
