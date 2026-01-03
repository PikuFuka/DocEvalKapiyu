import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useNotification } from './Notification';

// Embedded Custom CSS for modern styling
const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
  
  .form-control, .form-select {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    padding: 0.75rem 1rem;
    transition: all 0.2s ease;
  }

  .form-control:focus, .form-select:focus {
    background-color: #fff;
    border-color: #198754;
    box-shadow: 0 0 0 4px rgba(25, 135, 84, 0.1);
  }

  .step-circle {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .step-active {
    box-shadow: 0 0 0 5px rgba(25, 135, 84, 0.2);
    transform: scale(1.1);
  }

  .btn-gradient {
    background: linear-gradient(135deg, #198754 0%, #157347 100%);
    border: none;
    transition: transform 0.2s;
  }

  .btn-gradient:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(21, 115, 71, 0.3);
  }
`;

const FacultyRegister = () => {
  const { registerFaculty } = useAuth();
  const { notify } = useNotification();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    degree_name: '',
    hei_name: '',
    year_graduated: '',
    faculty_rank: '',
    mode_of_appointment: 'NBC 461',
    date_of_appointment: '',
    suc_name: '',
    campus: '',
    address: ''
  });

  const facultyRanks = [
    'Instructor I', 'Instructor II', 'Instructor III',
    'Assistant Professor I', 'Assistant Professor II', 'Assistant Professor III',
    'Assistant Professor IV', 'Assistant Professor V',
    'Associate Professor I', 'Associate Professor II', 'Associate Professor III',
    'Associate Professor IV', 'Associate Professor V',
    'Professor I', 'Professor II', 'Professor III', 'Professor IV', 'Professor V', 'Professor VI',
    'College/University Professor'
  ];

  useEffect(() => {
    AOS.init({ duration: 700, once: true });
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const goToStep2 = () => {
    const requiredStep1 = ['first_name', 'last_name', 'email', 'password'];
    const missing = requiredStep1.find(key => !formData[key]?.toString().trim());
    if (missing) {
      notify.error('Please fill all required personal information before continuing.');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.date_of_appointment) {
      notify.error('Please select Date of Appointment (YYYY-MM-DD).');
      setStep(2);
      setLoading(false);
      return;
    }

    const payload = { ...formData, username: formData.username?.trim() || formData.email?.trim() };

    try {
      const result = await registerFaculty(payload);
      if (result.success) {
        notify.success('Registration successful! Please check your email to verify your account.');
      } else {
        notify.error(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      notify.error('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-vh-100 d-flex align-items-center justify-content-center py-5 position-relative overflow-hidden" style={{ background: '#f0f2f5' }}>
      <style>{customStyles}</style>
      
      {/* Enhanced Background Shapes */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
        <motion.div 
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="position-absolute top-0 start-0 bg-success rounded-circle blur-3xl" 
          style={{ width: '600px', height: '600px', transform: 'translate(-20%, -20%)' }}
        />
        <motion.div 
          animate={{ y: [0, 20, 0], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="position-absolute bottom-0 end-0 bg-primary rounded-circle blur-3xl" 
          style={{ width: '500px', height: '500px', transform: 'translate(20%, 20%)' }}
        />
      </div>

      <div className="container position-relative z-1">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7">
            <motion.div 
              className="card border-0 shadow-lg rounded-4 overflow-hidden glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Header Section */}
              <div className="card-header bg-transparent border-0 pt-5 pb-0 d-flex flex-column align-items-center">
                <div 
                  className="mb-4 d-flex align-items-center justify-content-center bg-success bg-gradient text-white rounded-circle shadow"
                  style={{ width: '72px', height: '72px' }}
                >
                  <i className="bi bi-person-plus-fill fs-2"></i>
                </div>
                <h3 className="fw-bold text-dark mb-1">Faculty Registration</h3>
                <p className="text-muted small">Create your academic profile</p>
              </div>

              <div className="card-body p-4 p-md-5 pt-3">
                {/* Modern Progress Steps */}
                <div className="position-relative mb-5 px-4 mt-2">
                  <div className="progress bg-light rounded-pill" style={{ height: '6px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      role="progressbar" 
                      style={{ width: step === 1 ? '0%' : '100%', transition: 'width 0.4s ease-in-out' }}
                    ></div>
                  </div>
                  
                  <div className="position-absolute top-0 start-0 w-100 translate-middle-y d-flex justify-content-between px-4">
                    {/* Step 1 Indicator */}
                    <div className="d-flex flex-column align-items-center" style={{ marginTop: '-2px' }}>
                      <div className={`step-circle rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-2 ${step >= 1 ? 'bg-success text-white border-success step-active' : 'bg-white text-muted border-light'}`} style={{ width: '36px', height: '36px', zIndex: 1, cursor: 'default' }}>
                        1
                      </div>
                      <small className={`fw-bold text-uppercase mt-2 ${step === 1 ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Personal</small>
                    </div>

                    {/* Step 2 Indicator */}
                    <div className="d-flex flex-column align-items-center" style={{ marginTop: '-2px' }}>
                      <div className={`step-circle rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-2 ${step >= 2 ? 'bg-success text-white border-success step-active' : 'bg-white text-muted border-light'}`} style={{ width: '36px', height: '36px', zIndex: 1, cursor: 'default' }}>
                        2
                      </div>
                      <small className={`fw-bold text-uppercase mt-2 ${step === 2 ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Academic</small>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h5 className="mb-4 text-success fw-bold"><i className="bi bi-person-badge me-2"></i>Personal Information</h5>
                        <div className="row g-3">
                          <div className="col-md-5">
                            <label className="form-label small fw-bold text-secondary">First Name</label>
                            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="form-control" placeholder="John" required />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label small fw-bold text-secondary">M.I.</label>
                            <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} className="form-control text-center" placeholder="D." maxLength="2" />
                          </div>
                          <div className="col-md-5">
                            <label className="form-label small fw-bold text-secondary">Last Name</label>
                            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="form-control" placeholder="Doe" required />
                          </div>

                          <div className="col-12 mt-3">
                            <label className="form-label small fw-bold text-secondary">Email Address</label>
                            <div className="input-group">
                              <span className="input-group-text bg-white text-muted border-end-0"><i className="bi bi-envelope"></i></span>
                              <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control border-start-0 ps-0" placeholder="john.doe@example.com" required />
                            </div>
                          </div>
                          
                          <div className="col-12 mt-3">
                            <label className="form-label small fw-bold text-secondary">Password</label>
                            <div className="input-group">
                              <span className="input-group-text bg-white text-muted border-end-0"><i className="bi bi-lock"></i></span>
                              <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control border-start-0 ps-0" placeholder="••••••••" required />
                            </div>
                          </div>
                        </div>

                        <div className="mt-5">
                          <button type="button" className="btn btn-gradient text-white w-100 py-2.5 fw-bold rounded-3 shadow-sm" onClick={goToStep2}>
                            Continue to Academic Profile <i className="bi bi-arrow-right ms-2"></i>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                         <h5 className="mb-4 text-success fw-bold"><i className="bi bi-mortarboard me-2"></i>Academic Profile</h5>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Degree Name</label>
                            <input type="text" name="degree_name" value={formData.degree_name} onChange={handleChange} className="form-control" placeholder="e.g. BS Computer Science" required />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">HEI Name</label>
                            <input type="text" name="hei_name" value={formData.hei_name} onChange={handleChange} className="form-control" placeholder="Institution Name" required />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Year Graduated</label>
                            <input type="number" name="year_graduated" value={formData.year_graduated} min="1900" max={new Date().getFullYear()} onChange={handleChange} className="form-control" required />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Faculty Rank</label>
                            <select name="faculty_rank" value={formData.faculty_rank} onChange={handleChange} className="form-select" required>
                              <option value="">Select Rank</option>
                              {facultyRanks.map(rank => (
                                <option key={rank} value={rank}>{rank}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">Date of Appointment</label>
                            <input type="date" name="date_of_appointment" value={formData.date_of_appointment} onChange={handleChange} className="form-control" required />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-secondary">SUC Name</label>
                            <input type="text" name="suc_name" value={formData.suc_name} onChange={handleChange} className="form-control" placeholder="State University/College" required />
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-bold text-secondary">Campus</label>
                            <input type="text" name="campus" value={formData.campus} onChange={handleChange} className="form-control" placeholder="Main Campus" required />
                          </div>

                          <div className="col-12">
                            <label className="form-label small fw-bold text-secondary">Address</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} className="form-control" rows="2" placeholder="Full Address" required></textarea>
                          </div>
                        </div>

                        <div className="d-flex gap-3 mt-5">
                          <button type="button" className="btn btn-outline-secondary w-50 py-2 fw-bold rounded-3" onClick={() => setStep(1)}>
                            <i className="bi bi-arrow-left me-2"></i> Back
                          </button>

                          <button type="submit" className="btn btn-gradient text-white w-50 py-2 fw-bold rounded-3 shadow-sm" disabled={loading}>
                            {loading ? (
                              <><span className="spinner-border spinner-border-sm me-2"></span> Processing...</>
                            ) : (
                              'Complete Registration'
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>

                <div className="text-center mt-5 pt-3 border-top border-light">
                  <p className="text-muted small mb-0">
                    Already have an account? <Link to="/login" className="text-success text-decoration-none fw-bold hover-underline">Sign in</Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyRegister;