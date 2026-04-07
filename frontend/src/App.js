import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './components/Notification';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import LoadingOverlay from './components/LoadingOverlay';
import Home from './components/Home';
import Upload from './components/Upload';
import About from './components/About';
import FacultyDashboard from './components/FacultyDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/login';
import FacultyRegister from './components/FacultyRegister';
import EmailVerification from './components/EmailVerification';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ClassificationReview from './components/ClassificationReview';
import api from './services/api';
import './App.css'; 



// Protect routes based on authentication and role
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.is_staff !== (requiredRole === 'admin')) {
    return <Navigate to="/" replace />;
  }

  // Assuming email verification is required for all authenticated users
  if (!user?.email_verified) {
    // Optionally redirect to a "please verify email" page, or show a message
    // For now, we let them proceed but components can check email_verified
    console.warn("User email not verified.");
  }

  return children;
};

const ReviewQueueGuard = ({ children, requirePending = false }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [checkingQueue, setCheckingQueue] = useState(true);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [queueError, setQueueError] = useState('');

  useEffect(() => {
    const shouldCheckQueue = isAuthenticated && user && !user.is_staff;
    if (!shouldCheckQueue) {
      setPendingReviewCount(0);
      setQueueError('');
      setCheckingQueue(false);
      return;
    }

    let isMounted = true;

    const fetchPendingQueue = async () => {
      setCheckingQueue(true);
      try {
        const response = await api.get('/user/uploads/');
        const uploads = Array.isArray(response.data) ? response.data : [];
        const pending = uploads.filter((upload) => upload.status === 'for_review').length;
        if (isMounted) {
          setPendingReviewCount(pending);
          setQueueError('');
        }
      } catch (error) {
        console.error('Failed to fetch pending review queue:', error);
        if (isMounted) {
          setQueueError('Unable to verify your review queue. Please retry.');
        }
      } finally {
        if (isMounted) {
          setCheckingQueue(false);
        }
      }
    };

    fetchPendingQueue();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  if (loading || checkingQueue) {
    return <LoadingOverlay message="Checking review queue..." />;
  }

  if (queueError) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center px-3" style={{ background: '#f1f5f9' }}>
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ maxWidth: '520px', width: '100%' }}>
          <h5 className="fw-bold text-dark mb-2">Review Queue Check Failed</h5>
          <p className="text-secondary small mb-3">{queueError}</p>
          <button
            type="button"
            className="btn btn-primary rounded-pill px-4 fw-bold"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.is_staff) {
    return children;
  }

  if (requirePending && pendingReviewCount === 0) {
    return <Navigate to="/faculty-dashboard" replace />;
  }

  if (!requirePending && pendingReviewCount > 0) {
    return <Navigate to="/classification-review" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={
            <ProtectedRoute requiredRole="faculty">
              <ReviewQueueGuard>
                <Upload />
              </ReviewQueueGuard>
            </ProtectedRoute>
          } />
          <Route path="/about" element={<About />} />
          <Route path="/faculty-dashboard" element={
            <ProtectedRoute requiredRole="faculty">
              <ReviewQueueGuard>
                <FacultyDashboard />
              </ReviewQueueGuard>
            </ProtectedRoute>
          } />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute requiredRole="faculty">
              <AnalyticsDashboard />
            </ProtectedRoute>
          } />
          <Route path="/classification-review" element={
            <ProtectedRoute requiredRole="faculty">
              <ReviewQueueGuard requirePending>
                <ClassificationReview />
              </ReviewQueueGuard>
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/faculty-register" element={<FacultyRegister />} />
          <Route path="/verify-email/:token" element={<EmailVerification />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;