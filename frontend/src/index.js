import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // We'll define global styles in App.css
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Normalize accidental repeated slashes in path (e.g. //verify-email/...) before routing.
const normalizedPath = window.location.pathname.replace(/\/{2,}/g, '/');
if (normalizedPath !== window.location.pathname) {
  const normalizedUrl = `${normalizedPath}${window.location.search}${window.location.hash}`;
  window.history.replaceState({}, '', normalizedUrl);
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);