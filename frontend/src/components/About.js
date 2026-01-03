import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "aos/dist/aos.css";
import AOS from "aos";


AOS.init();

const About = () => {
  return (
    <div className="about-page bg-white">
      {/* Hero Section - Colorful & Modern */}
      <section className="about-hero py-5 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
        <div className="position-absolute top-0 end-0 rounded-circle bg-primary opacity-10 blur-3xl" 
             style={{ width: '500px', height: '500px', transform: 'translate(30%, -30%)', filter: 'blur(80px)' }}></div>
        
        <div className="container py-5 text-center position-relative z-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h6 className="text-primary fw-bold text-uppercase tracking-wide mb-3">About Us</h6>
            <h1 className="display-4 fw-bold text-dark mb-4">Revolutionizing Faculty Evaluation</h1>
            <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
              We are dedicated to bringing transparency, efficiency, and fairness to academic assessments through the power of artificial intelligence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content - Clean Grid */}
      <section className="py-5">
        <div className="container py-5">
          <div className="row align-items-center gy-5">
            <div className="col-lg-6" data-aos="fade-right">
              <div className="pe-lg-5">
                <h2 className="fw-bold mb-4">Our Story</h2>
                <p className="text-muted mb-4">
                  DocEvalKapiyu was born from the need for a more efficient, transparent, and objective way to evaluate faculty performance. Traditional methods often involve manual paperwork and subjective biases.
                </p>
                <p className="text-muted mb-4">
                  Our platform leverages state-of-the-art Machine Learning and Natural Language Processing to automate the classification and scoring of academic documents, ensuring every faculty member is evaluated fairly based on established criteria.
                </p>
              </div>
            </div>
            <div className="col-lg-6 d-flex justify-content-center" data-aos="fade-left">
              <div className="bg-light rounded-4 p-4 position-relative w-100" style={{ maxWidth: '500px' }}>
                <div className="position-absolute top-0 start-0 translate-middle bg-primary rounded-circle" style={{ width: '100px', height: '100px', opacity: 0.1, zIndex: 0 }}></div>
                <img
                  src="/images/image.png"
                  alt="About Us"
                  className="img-fluid rounded-3 shadow-sm position-relative z-1 w-100"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="position-absolute bottom-0 end-0 translate-middle bg-warning rounded-circle" style={{ width: '80px', height: '80px', opacity: 0.1, zIndex: 0 }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision - Colorful Cards */}
      <section className="py-5 bg-white">
        <div className="container py-5">
          <div className="row g-4">
            <div className="col-md-6" data-aos="fade-up" data-aos-delay="100">
              <div className="card h-100 border-0 shadow-sm p-4 bg-primary bg-opacity-10 hover-lift transition-all">
                <div className="card-body">
                  <div className="mb-4 text-primary bg-white d-inline-flex p-3 rounded-circle shadow-sm">
                    <i className="bi bi-rocket-takeoff fs-2"></i>
                  </div>
                  <h3 className="fw-bold mb-3 text-dark">Our Mission</h3>
                  <p className="text-dark opacity-75 mb-0">
                    To empower educational institutions with intelligent tools that foster professional growth, academic integrity, and administrative efficiency through data-driven insights.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6" data-aos="fade-up" data-aos-delay="200">
              <div className="card h-100 border-0 shadow-sm p-4 bg-info bg-opacity-10 hover-lift transition-all">
                <div className="card-body">
                  <div className="mb-4 text-info bg-white d-inline-flex p-3 rounded-circle shadow-sm">
                    <i className="bi bi-eye fs-2"></i>
                  </div>
                  <h3 className="fw-bold mb-3 text-dark">Our Vision</h3>
                  <p className="text-dark opacity-75 mb-0">
                    To be the global standard for academic document evaluation, creating a future where technology and education work in perfect harmony to recognize excellence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values - Minimal List */}
      <section className="py-5 bg-light">
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="fw-bold">Core Values</h2>
          </div>
          <div className="row g-4">
            {[
              { title: 'Transparency', desc: 'Open and clear processes.', icon: 'bi-shield-check', color: 'primary' },
              { title: 'Innovation', desc: 'Pushing boundaries with AI.', icon: 'bi-lightbulb', color: 'warning' },
              { title: 'Integrity', desc: 'Commitment to fairness.', icon: 'bi-award', color: 'success' },
              { title: 'Excellence', desc: 'Quality in every detail.', icon: 'bi-star', color: 'danger' },
            ].map((value, i) => (
              <div className="col-md-3 text-center" key={i} data-aos="fade-up" data-aos-delay={i * 100}>
                <div className={`mb-3 text-${value.color} fs-1`}>
                  <i className={`bi ${value.icon}`}></i>
                </div>
                <h5 className="fw-bold">{value.title}</h5>
                <p className="text-muted small">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
        }
        .transition-all {
          transition: all 0.3s ease;
        }
      `}</style>

      {/* Footer - Centered & Polished */}
      <footer className="py-5 bg-white border-top">
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
          <div className="border-top pt-4 text-center">
            <p className="text-muted small mb-0">&copy; {new Date().getFullYear()} DocEvalKapiyu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
