import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    AOS.init({ 
      duration: 1000, 
      once: false,
      mirror: true,
      easing: "ease-out-cubic",
    });
  }, []);

  return (
    <div className="home-page overflow-hidden" 
      style={{ 
        background: 'radial-gradient(circle at top right, #f8faff 0%, #ffffff 40%, #f0f7ff 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Hero Section - Modern & Colorful */}
      <section className="home-hero d-flex align-items-center position-relative overflow-hidden"
        style={{
          minHeight: '90vh',
          background: 'transparent',
        }}
      >
        {/* Abstract Shapes for Color */}
        <div className="position-absolute top-0 end-0 rounded-circle bg-primary opacity-10 blur-3xl animate-blob" 
             style={{ width: '600px', height: '600px', transform: 'translate(30%, -30%)', filter: 'blur(100px)' }}></div>
        <div className="position-absolute bottom-0 start-0 rounded-circle bg-info opacity-10 blur-3xl animate-blob animation-delay-2000" 
             style={{ width: '400px', height: '400px', transform: 'translate(-30%, 30%)', filter: 'blur(80px)' }}></div>
        <div className="position-absolute top-50 start-50 rounded-circle bg-purple opacity-5 blur-3xl animate-blob animation-delay-4000" 
             style={{ width: '500px', height: '500px', transform: 'translate(-50%, -50%)', filter: 'blur(120px)' }}></div>

        <div className="container position-relative z-1">
          <div className="row align-items-center gy-5">
            <div className="col-lg-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="display-3 fw-bold mb-4 text-dark lh-sm">
                  Intelligent <span className="text-primary position-relative">
                    Faculty
                    <svg className="position-absolute w-100" style={{ bottom: '5px', left: 0, height: '10px', zIndex: -1, opacity: 0.3 }} viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="var(--bs-primary)" strokeWidth="8" fill="none" />
                    </svg>
                  </span> <br/>
                  Document Analysis
                </h1>
                <p className="lead text-muted mb-5 pe-lg-5">
                  Automated scoring, instant feedback, and data-driven insights.
                </p>

                <div className="d-flex flex-wrap gap-3">
                  {!isAuthenticated ? (
                    <>
                      <Link
                        to="/faculty-register"
                        className="btn btn-primary btn-lg px-5 py-3 rounded-pill fw-bold shadow-lg hover-scale"
                      >
                        Get Started <i className="bi bi-arrow-right ms-2"></i>
                      </Link>
                      <Link
                        to="/login"
                        className="btn btn-white text-dark btn-lg px-5 py-3 rounded-pill fw-bold shadow-sm hover-scale"
                      >
                        Sign In
                      </Link>
                    </>
                  ) : (
                    <Link 
                      to={user?.is_staff ? "/admin-dashboard" : "/faculty-dashboard"} 
                      className="btn btn-primary btn-lg px-5 py-3 rounded-pill fw-bold shadow-lg hover-scale"
                    >
                      Go to Dashboard <i className="bi bi-arrow-right ms-2"></i>
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>
            
            {/* Hero Visual */}
            <div className="col-lg-6 d-flex justify-content-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="position-relative w-100"
                style={{ maxWidth: '550px' }}
              >
                <div className="position-relative z-2 bg-white rounded-4 shadow-lg p-2">
                  {/* Suggestion: Use a high-quality screenshot of the actual dashboard or a 3D illustration of documents being scanned */}
                  <img 
                    src="/images/dashburd.png" 
                    alt="Platform Dashboard Preview" 
                    className="img-fluid rounded-3 bg-light w-100" 
                    style={{ minHeight: '300px', objectFit: 'cover' }} 
                    loading="eager"
                    fetchPriority="high"
                  />
                  
                  {/* Floating Elements */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="position-absolute top-0 end-0 translate-middle-y bg-white p-3 rounded-4 shadow-lg d-none d-md-block"
                    style={{ marginRight: '-20px', marginTop: '40px' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success">
                        <i className="bi bi-check-circle-fill fs-4"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0">Analysis Complete</h6>
                        <small className="text-muted">Just now</small>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="position-absolute bottom-0 start-0 translate-middle-y bg-white p-3 rounded-4 shadow-lg d-none d-md-block"
                    style={{ marginLeft: '-20px', marginBottom: '40px' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
                        <i className="bi bi-file-earmark-text-fill fs-4"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0">New Upload</h6>
                        <small className="text-muted">Processing...</small>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Decorative Blob */}
                <div className="position-absolute top-50 start-50 translate-middle w-100 h-100 bg-primary opacity-10 rounded-circle blur-3xl" style={{ zIndex: -1 }}></div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Colorful Cards */}
      <section className="py-5 position-relative">
        <div className="container py-5">
          <div className="text-center mb-5 mx-auto" style={{ maxWidth: '700px' }}>
            <h6 className="text-primary fw-bold text-uppercase tracking-wide">Why Choose Us</h6>
            <h2 className="display-5 fw-bold mb-3">Powerful Features for Modern Education</h2>
            <p className="text-muted lead">Everything you need to streamline faculty evaluation in one intelligent platform.</p>
          </div>
          
          <div className="row gy-4">
            {[
              { title: 'Smart Upload', desc: 'Seamlessly integrate with Google Drive for instant document submission and processing.', icon: 'bi-cloud-upload', color: 'primary' },
              { title: 'AI Analysis', desc: 'Advanced NLP algorithms automatically extract, analyze, and validate document content.', icon: 'bi-cpu', color: 'purple' },
              { title: 'Auto Scoring', desc: 'Instant, objective classification and scoring based on standardized KRA criteria.', icon: 'bi-calculator', color: 'success' },
              { title: 'Analytics', desc: 'Visual insights and comprehensive reports to track performance trends over time.', icon: 'bi-graph-up', color: 'warning' },
            ].map((feature, i) => (
              <div className="col-md-6 col-lg-3" key={i} data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="card h-100 border-0 bg-white bg-opacity-60 backdrop-blur rounded-4 p-4 hover-lift transition-all shadow-sm">
                  <div className={`mb-4 d-inline-flex align-items-center justify-content-center rounded-3 bg-${feature.color} bg-opacity-10 text-${feature.color}`} style={{ width: '60px', height: '60px' }}>
                    <i className={`bi ${feature.icon} fs-3`}></i>
                  </div>
                  <h5 className="fw-bold mb-3">{feature.title}</h5>
                  <p className="text-muted mb-0 lh-base">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Centered & Clean */}
      <section className="py-5">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="fw-bold display-6">How It Works</h2>
            <p className="text-muted">Simple steps to automated evaluation</p>
          </div>

          <div className="row g-4 justify-content-center">
            {[
              { step: '1', title: 'Upload', desc: 'Submit via Drive link', icon: 'bi-cloud-arrow-up' },
              { step: '2', title: 'Process', desc: 'AI analyzes content', icon: 'bi-gear-wide-connected' },
              { step: '3', title: 'Score', desc: 'Automated calculation', icon: 'bi-check-circle' },
              { step: '4', title: 'Result', desc: 'View detailed report', icon: 'bi-file-earmark-bar-graph' },
            ].map((process, i) => (
              <div className="col-md-6 col-lg-3" key={i} data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100 position-relative overflow-hidden hover-lift bg-white bg-opacity-70 backdrop-blur">
                  <div className="position-relative z-1">
                    <div className="mb-3 mx-auto d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold shadow-sm" 
                         style={{width: '60px', height: '60px', fontSize: '1.5rem'}}>
                      <i className={`bi ${process.icon}`}></i>
                    </div>
                    <h5 className="fw-bold mb-2">{process.title}</h5>
                    <p className="text-muted small mb-0">{process.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Centered & Polished */}
      <footer className="py-5 mt-5">
        <div className="container">
          <div className="row gy-4 justify-content-center text-center">
            <div className="col-lg-8">
              <div className="mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 mb-3" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-mortarboard-fill"></i>
                </div>
                <h4 className="fw-bold text-dark">DocEvalKapiyu</h4>
                <p className="text-muted">Empowering academic excellence through intelligent evaluation.</p>
              </div>
              
              <div className="d-flex justify-content-center gap-4 mb-4">
                <Link to="/" className="text-decoration-none text-muted fw-medium hover-primary">Home</Link>
                <Link to="/about" className="text-decoration-none text-muted fw-medium hover-primary">About</Link>
                <Link to="/login" className="text-decoration-none text-muted fw-medium hover-primary">Login</Link>
              </div>

              <div className="d-flex justify-content-center gap-3 mb-4">
                <a href="#" className="btn btn-light btn-sm rounded-circle text-primary"><i className="bi bi-facebook"></i></a>
                <a href="#" className="btn btn-light btn-sm rounded-circle text-primary"><i className="bi bi-twitter"></i></a>
                <a href="#" className="btn btn-light btn-sm rounded-circle text-primary"><i className="bi bi-linkedin"></i></a>
              </div>
            </div>
          </div>
          <div className="pt-4 text-center">
            <p className="text-muted small mb-0">&copy; {new Date().getFullYear()} DocEvalKapiyu. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .hover-scale:hover {
          tme-page {
          scroll-behavior: smooth;
        }
        .backdrop-blur {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08
        .hover-primary:hover {
          color: var(--bs-primary) !important;
        }
        .bg-purple { background-color: #6f42c1; }
        .text-purple { color: #6f42c1; }
      `}</style>
    </div>
  );
};

export default Home;
