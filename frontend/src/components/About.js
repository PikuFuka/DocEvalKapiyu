import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "aos/dist/aos.css";
import AOS from "aos";

const About = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      easing: "ease-out-cubic",
    });
  }, []);

  return (
    <div className="about-page overflow-hidden"
      style={{ 
        background: 'radial-gradient(circle at top left, #f8faff 0%, #ffffff 40%, #f0f7ff 100%)',
        minHeight: '100vh'
      }}
    >
      {/* GLOBAL STYLES & ANIMATIONS */}
      <style jsx>{`
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
        .bg-grid {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
        }
        .text-gradient {
          background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05) !important;
        }
        .hover-card {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .hover-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 50px -12px rgba(13, 110, 253, 0.12) !important;
          border-color: rgba(13, 110, 253, 0.2) !important;
        }
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
        }
        .hero-blob {
          position: absolute;
          filter: blur(100px);
          opacity: 0.5;
          z-index: 0;
        }
        .nbc-banner {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          border-radius: 2rem;
        }
        .creator-showcase-wrap {
          position: relative;
          border-radius: 1.6rem;
          padding: 1.4rem;
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.86) 0%, rgba(243, 249, 255, 0.95) 100%);
          border: 1px solid rgba(13, 110, 253, 0.12);
          box-shadow: 0 20px 42px -24px rgba(13, 70, 146, 0.35);
          overflow: hidden;
        }
        .creator-showcase-wrap::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -80px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(13, 110, 253, 0.22) 0%, rgba(13, 110, 253, 0) 72%);
          pointer-events: none;
        }
        .creator-modern-card {
          position: relative;
          height: 100%;
          border-radius: 1.3rem;
          border: 1px solid rgba(26, 83, 158, 0.16);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(247, 251, 255, 0.88) 100%);
          box-shadow: 0 14px 26px -20px rgba(18, 62, 126, 0.6);
          padding: 1rem;
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .creator-modern-card:hover {
          transform: translateY(-7px);
          border-color: rgba(13, 110, 253, 0.3);
          box-shadow: 0 24px 36px -22px rgba(18, 62, 126, 0.52);
        }
        .creator-image-shell {
          border-radius: 1rem;
          padding: 7px;
          background: linear-gradient(135deg, rgba(13, 110, 253, 0.2) 0%, rgba(13, 202, 240, 0.18) 45%, rgba(25, 135, 84, 0.16) 100%);
        }
        .creator-image-placeholder {
          width: 100%;
          aspect-ratio: 1 / 1;
          border: 1.5px dashed rgba(13, 110, 253, 0.36);
          border-radius: 0.9rem;
          background:
            radial-gradient(circle at 20% 20%, rgba(13, 110, 253, 0.11) 0%, rgba(13, 110, 253, 0) 45%),
            radial-gradient(circle at 78% 78%, rgba(13, 202, 240, 0.12) 0%, rgba(13, 202, 240, 0) 38%),
            linear-gradient(145deg, #f8fbff 0%, #eef5ff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #224a7b;
          gap: 0.35rem;
          position: relative;
          overflow: hidden;
        }
        .creator-image-placeholder::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: linear-gradient(90deg, rgba(13, 110, 253, 0.06) 1px, transparent 1px),
                            linear-gradient(0deg, rgba(13, 110, 253, 0.06) 1px, transparent 1px);
          background-size: 22px 22px;
          opacity: 0.45;
        }
        .creator-image-placeholder i {
          font-size: 2.05rem;
          color: #0d6efd;
          position: relative;
          z-index: 1;
        }
        .creator-image-placeholder span {
          position: relative;
          z-index: 1;
        }
        .creator-placeholder-step {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 1;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #2f5f99;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(13, 110, 253, 0.2);
        }
        .creator-placeholder-title {
          font-size: 0.9rem;
          font-weight: 700;
          text-align: center;
        }
        .creator-placeholder-note {
          font-size: 0.75rem;
          font-weight: 500;
          color: #4d6990;
        }
        .creator-role-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #0d4b97;
          background: rgba(13, 110, 253, 0.1);
          border: 1px solid rgba(13, 110, 253, 0.14);
        }
        @media (max-width: 991.98px) {
          .creator-showcase-wrap {
            padding: 1rem;
          }
        }
      `}</style>

      {/* HERO SECTION */}
      <section className="position-relative py-5 bg-grid">
        <div className="hero-blob bg-primary rounded-circle animate-blob" style={{ width: '500px', height: '500px', top: '-10%', right: '-5%' }}></div>
        <div className="hero-blob bg-info rounded-circle animate-blob animation-delay-2000" style={{ width: '400px', height: '400px', bottom: '10%', left: '-5%', opacity: 0.4 }}></div>
        <div className="hero-blob bg-purple rounded-circle animate-blob animation-delay-4000" style={{ width: '300px', height: '300px', top: '20%', left: '10%', opacity: 0.2, backgroundColor: '#6f42c1' }}></div>

        <div className="container py-5 position-relative z-1">
          <div className="row align-items-center">
            <div className="col-lg-7 text-center text-lg-start mb-5 mb-lg-0">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="d-inline-flex align-items-center px-3 py-1 rounded-pill bg-primary bg-opacity-10 text-primary fw-bold small mb-3">
                  <span className="me-2">🚀</span> Innovation in Education
                </div>
                <h1 className="display-3 fw-bold text-dark mb-4 lh-sm">
                  Smart Evaluation for <br />
                  <span className="text-gradient">Academic Excellence</span>
                </h1>
                <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                  <button className="btn btn-primary btn-lg rounded-pill px-4 shadow-sm">Get Started</button>
                  <button className="btn btn-outline-secondary btn-lg rounded-pill px-4">Learn More</button>
                </div>
              </motion.div>
            </div>
            
            {/* Abstract Visual Representation instead of generic image */}
            <div className="col-lg-5">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="position-relative"
              >
                 <div className="glass-card p-4 rounded-4 position-relative z-2">
                    <div className="d-flex align-items-center mb-3">
                        <div className="bg-success bg-opacity-10 text-success p-2 rounded-3 me-3"><i className="bi bi-file-earmark-check fs-4"></i></div>
                        <div>
                            <h6 className="mb-0 fw-bold">NBC 461 Compliance</h6>
                            <small className="text-muted">Document Verified</small>
                        </div>
                        <div className="ms-auto text-success"><i className="bi bi-check-circle-fill"></i></div>
                    </div>
                    <div className="progress" style={{height: "6px"}}>
                        <div className="progress-bar bg-success" style={{width: "100%"}}></div>
                    </div>
                 </div>
                 
                 <div className="glass-card p-4 rounded-4 mt-3 ms-4 position-relative z-1" style={{opacity: 0.8}}>
                    <div className="d-flex align-items-center mb-3">
                        <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3 me-3"><i className="bi bi-cpu fs-4"></i></div>
                        <div>
                            <h6 className="mb-0 fw-bold">AI Processing</h6>
                            <small className="text-muted">Analyzing Content...</small>
                        </div>
                    </div>
                    <div className="progress" style={{height: "6px"}}>
                        <div className="progress-bar bg-primary progress-bar-striped progress-bar-animated" style={{width: "75%"}}></div>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CREATED BY SECTION */}
      <section className="py-5 position-relative">
        <div className="container py-5">
            <div className="text-center mb-5 mx-auto" style={{ maxWidth: '760px' }}>
              <h6 className="text-primary fw-bold text-uppercase mb-2">Created By</h6>
              <h2 className="fw-bold mb-3 display-6">The Team Behind DocEvalKapiyu</h2>
              <p className="text-muted mb-0">
                Replace each placeholder with your team photo to showcase the creators of this website.
              </p>
            </div>

            <div className="creator-showcase-wrap">
              <div className="row g-4 justify-content-center">
                {[
                  { name: 'Creator 1', role: 'Project Lead' },
                  { name: 'Creator 2', role: 'Backend Developer' },
                  { name: 'Creator 3', role: 'Frontend Developer' },
                ].map((member, i) => (
                  <div className="col-md-6 col-lg-4" key={i} data-aos="fade-up" data-aos-delay={i * 120}>
                    <div className="creator-modern-card text-center">
                      <div className="creator-image-shell mb-3">
                        <div className="creator-image-placeholder">
                          <span className="creator-placeholder-step">Slot {i + 1}</span>
                          <i className="bi bi-image"></i>
                          <span className="creator-placeholder-title">Team Photo Placeholder</span>
                          <span className="creator-placeholder-note">Use square image, 1080 x 1080</span>
                        </div>
                      </div>
                      <h5 className="fw-bold mb-1 text-dark">{member.name}</h5>
                      <span className="creator-role-chip">{member.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>
      </section>

      {/* NBC 461 FEATURE SECTION (Styled like the uploaded image) */}
      <section className="py-5">
        <div className="container py-4">
            <div className="nbc-banner p-5 position-relative overflow-hidden text-center text-white shadow-lg" data-aos="zoom-in">
                {/* Decorative Shapes */}
                <div className="position-absolute top-0 start-0 bg-white opacity-10 rounded-circle animate-blob" style={{width: '300px', height: '300px', transform: 'translate(-30%, -30%)'}}></div>
                <div className="position-absolute bottom-0 end-0 bg-white opacity-10 rounded-circle animate-blob animation-delay-2000" style={{width: '200px', height: '200px', transform: 'translate(20%, 20%)'}}></div>
                <div className="position-absolute top-0 end-0 bg-white opacity-10 rounded-circle" style={{width: '100px', height: '100px', transform: 'translate(20%, -20%)'}}></div>

                <div className="position-relative z-1 py-3">
                    <div className="bg-white bg-opacity-20 d-inline-block p-3 rounded-circle mb-4 backdrop-blur">
                        <i className="bi bi-file-earmark-bar-graph fs-2"></i>
                    </div>
                    <h2 className="fw-bold mb-3 display-5">Advancing NBC 461 9th Cycle</h2>
                    <p className="lead opacity-90 mx-auto" style={{maxWidth: '800px'}}>
                        Aligned with <strong>DBM Joint Circular No. 3, s. 2022</strong>. We streamline the evaluation of Common Criteria (CCE) and Qualitative Contribution (QCE) to support a data-driven reclassification process.
                    </p>
                    <div className="mt-4">
                        <a 
                          href="/DBM-JC-No-3-s-2022-NBC-461.pdf" 
                          download="DBM-JC-No-3-s-2022-NBC-461.pdf"
                          className="btn btn-light text-primary fw-bold px-4 py-2 rounded-pill hover-lift text-decoration-none d-inline-block"
                        >
                            <i className="bi bi-download me-2"></i>View Guidelines
                        </a>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer - Centered & Polished (Matching Home) */}
      <footer className="py-5 mt-5">
        <div className="container">
          <div className="row gy-4 justify-content-center text-center">
            <div className="col-lg-8">
              <div className="mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 mb-3" style={{ width: '35px', height: '35px' }}>
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
    </div>
  );
};

export default About;