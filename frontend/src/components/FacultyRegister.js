import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const FacultyRegister = () => {
  const { registerFaculty } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  // validate important fields on step change
  const goToStep2 = () => {
    setError('');
    const requiredStep1 = ['first_name', 'last_name', 'email', 'password'];
    const missing = requiredStep1.find(key => !formData[key]?.toString().trim());
    if (missing) {
      setError('Please fill all required personal information before continuing.');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Ensure date_of_appointment exists and is in the date input format (YYYY-MM-DD)
    if (!formData.date_of_appointment) {
      setError('Please select Date of Appointment (YYYY-MM-DD).');
      setStep(2);
      setLoading(false);
      return;
    }

    // Prepare payload (use email as username if username empty)
    const payload = { ...formData, username: formData.username?.trim() || formData.email?.trim() };

    try {
      const result = await registerFaculty(payload);
      if (result.success) {
        setMessage('Registration successful! Please check your email to verify your account.');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page d-flex align-items-center justify-content-center"
      style={{
        minHeight: '92.5vh',
        background: 'linear-gradient(135deg , #4e54c8, #8f94fb 100%)',
        padding: '2rem'
      }}
    >
      <motion.div
        className="card shadow-lg p-4 rounded-4"
        style={{ maxWidth: '700px', width: '100%', backgroundColor: 'white' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        data-aos="zoom-in"
      >
        <h2 className="fw-bold text-center mb-3" style={{ color: '#343a40' }}>
          Faculty Registration
        </h2>
        <p className="text-center text-muted mb-4">
          {step === 1
            ? 'Step 1: Fill out your personal information'
            : 'Step 2: Complete your profile information'}
        </p>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
              >
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Middle Initial</label>
                    <input
                      type="text"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleChange}
                      className="form-control"
                      maxLength="2"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <motion.button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={goToStep2}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
              >
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Degree Name *</label>
                    <input
                      type="text"
                      name="degree_name"
                      value={formData.degree_name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">HEI Name *</label>
                    <input
                      type="text"
                      name="hei_name"
                      value={formData.hei_name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Year Graduated *</label>
                    <input
                      type="number"
                      name="year_graduated"
                      value={formData.year_graduated}
                      min="1900"
                      max={new Date().getFullYear()}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Faculty Rank *</label>
                    <select
                      name="faculty_rank"
                      value={formData.faculty_rank}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select Rank</option>
                      {facultyRanks.map(rank => (
                        <option key={rank} value={rank}>{rank}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Date of Appointment *</label>
                    <input
                      type="date"
                      name="date_of_appointment"
                      value={formData.date_of_appointment}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">SUC Name *</label>
                    <input
                      type="text"
                      name="suc_name"
                      value={formData.suc_name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Campus *</label>
                    <input
                      type="text"
                      name="campus"
                      value={formData.campus}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                {message && <div className="alert alert-success mt-3">{message}</div>}
                {error && <div className="alert alert-danger mt-3">{error}</div>}

                <div className="d-flex justify-content-between mt-4">
                  <motion.button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => { setError(''); setStep(1); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ← Back
                  </motion.button>

                  <motion.button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? 'Submitting...' : 'Submit'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="text-center mt-3">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-primary fw-semibold">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default FacultyRegister;
