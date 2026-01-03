import React from "react";
import { motion } from "framer-motion";
import "aos/dist/aos.css";
import AOS from "aos";


AOS.init();

const About = () => {
  return (
    <section className="about-section py-5 bg-light" id="about">
      <div className="container">
        {/* Section Header */}
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="fw-bold text-primary mb-3">About DocEvalKapiyu</h1>
          <p className="text-muted lead">
            Empowering institutions with intelligent and transparent faculty evaluation.
          </p>
          <div className="underline mx-auto mt-3"></div>
        </motion.div>

        {/* About Content */}
        <div className="row align-items-center">
          <motion.div
            className="col-md-6 mb-4 mb-md-0"
            data-aos="fade-right"
            data-aos-duration="800"
          >
          <img
            src="/images/image.png"
            alt="Faculty Evaluation Illustration"
            className="img-fluid rounded-4 shadow-lg"
          />
          </motion.div>

          <motion.div
            className="col-md-6"
            data-aos="fade-left"
            data-aos-duration="800"
          >
            <h2 className="fw-bold text-dark mb-3">What We Do</h2>
            <p className="text-secondary">
              <strong>DocEvalKapiyu</strong> is a web-based faculty evaluation system
              built to enhance transparency and efficiency within educational institutions.
              It allows administrators to evaluate faculty performance based on specific
              criteria while maintaining a user-friendly experience for both technical
              and non-technical users.
            </p>

            <ul className="list-unstyled text-secondary mt-3">
              <li>✅ Streamlined faculty evaluation process</li>
              <li>✅ Modern and responsive user interface</li>
              <li>✅ Secure authentication and data management</li>
              <li>✅ Comprehensive reports and analytics</li>
            </ul>

          </motion.div>
        </div>

        {/* Mission & Vision */}
        <motion.div
          className="row mt-5 pt-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="col-md-6 mb-4">
            <div className="p-4 bg-white shadow-sm rounded-4" data-aos="zoom-in">
              <h3 className="text-primary fw-bold mb-3">Our Mission</h3>
              <p className="text-secondary">
                To build a reliable and fair faculty evaluation platform that helps
                educational institutions make informed decisions, promote academic
                excellence, and ensure professional growth.
              </p>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="p-4 bg-white shadow-sm rounded-4" data-aos="zoom-in">
              <h3 className="text-primary fw-bold mb-3">Our Vision</h3>
              <p className="text-secondary">
                To become a trusted digital solution for faculty evaluation across
                universities — promoting transparency, innovation, and quality education.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Animation Background */}
      <motion.div
        className="floating-shape"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      ></motion.div>

      <style jsx>{`
        .underline {
          width: 80px;
          height: 4px;
          background-color: #0d6efd;
          border-radius: 2px;
        }

        .floating-shape {
          position: absolute;
          bottom: -30px;
          right: 10%;
          width: 120px;
          height: 120px;
          background: rgba(13, 110, 253, 0.1);
          border-radius: 50%;
          filter: blur(15px);
          z-index: -1;
        }

        .about-section {
          position: relative;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default About;
