import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div className="home-page">

      {/* Hero Section */}
      <section className="home-hero d-flex align-items-center text-center text-white"
        style={{
          background: 'linear-gradient(135deg, #4e54c8, #8f94fb);',
          minHeight: '90vh',
        }}
      >
        <div className="container py-5">
          <motion.h1
            className="display-4 fw-bold mb-3"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            DocEvalKapiyu
          </motion.h1>

          <motion.p
            className="lead mb-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Advanced Document Evaluation System for Faculty Assessment
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            {!isAuthenticated && (
              <div>
                <Link
                  to="/faculty-register"
                  className="btn btn-light btn-lg px-4 fw-semibold shadow-sm"
                  style={{ marginRight: '1rem' }}
                >
                  GET STARTED
                </Link>
              </div>
            )}

            {isAuthenticated && user?.is_staff === false && (
              <Link to="/faculty-dashboard" className="btn btn-light btn-lg shadow-sm">
                Go to Faculty Dashboard
              </Link>
            )}

            {isAuthenticated && user?.is_staff === true && (
              <Link to="/admin-dashboard" className="btn btn-light btn-lg shadow-sm">
                Go to Admin Dashboard
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features py-5 bg-light">
        <div className="container text-center">
          <h2 className="fw-bold mb-4" data-aos="fade-up">Features</h2>
          <div className="row gy-4">
            {[
              { title: 'Document Upload', desc: 'Upload Google Drive links for document evaluation' },
              { title: 'AI Processing', desc: 'Automatic text extraction and information processing' },
              { title: 'Classification', desc: 'ML-powered document classification and scoring' },
              { title: 'Google Sheets Integration', desc: 'Results exported to organized Google Sheets' },
            ].map((feature, i) => (
              <div className="col-md-6 col-lg-3" key={i} data-aos="zoom-in" data-aos-delay={i * 100}>
                <div className="card h-100 shadow-sm border-0 rounded-4 p-3 hover-lift">
                  <div className="card-body">
                    <i className="bi bi-lightning-charge-fill text-primary fs-2 mb-3"></i>
                    <h5 className="fw-bold">{feature.title}</h5>
                    <p className="text-muted">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="home-how py-5" style={{ backgroundColor: '#fff' }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-5" data-aos="fade-up">How It Works</h2>
          <div className="row gy-4">
            {[
              { step: '1. Upload Documents', desc: 'Faculty uploads Google Drive links' },
              { step: '2. Process Documents', desc: 'System extracts text and information' },
              { step: '3. Classify & Score', desc: 'ML model classifies and scores documents' },
              { step: '4. Review Results', desc: 'Results available in Google Sheets' },
            ].map((process, i) => (
              <div className="col-md-6 col-lg-3" key={i} data-aos="fade-up" data-aos-delay={i * 150}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="card h-100 shadow-sm border-0 rounded-4 p-4"
                >
                  <h5 className="fw-bold text-primary">{process.step}</h5>
                  <p className="text-muted">{process.desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

     
    </div>
  );
};

export default Home;
