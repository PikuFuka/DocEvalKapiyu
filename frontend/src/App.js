import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
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

function AppContent() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={
            <ProtectedRoute requiredRole="faculty">
              <Upload />
            </ProtectedRoute>
          } />
          <Route path="/about" element={<About />} />
          <Route path="/faculty-dashboard" element={
            <ProtectedRoute requiredRole="faculty">
              <FacultyDashboard />
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
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;