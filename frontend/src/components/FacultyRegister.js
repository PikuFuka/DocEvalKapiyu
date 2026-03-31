import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { useNotification } from "./Notification";

const FacultyRegister = () => {
  const { registerFaculty } = useAuth();
  const { notify } = useNotification();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    degree_name: "",
    hei_name: "",
    year_graduated: "",
    faculty_rank: "",
    mode_of_appointment: "NBC 461",
    date_of_appointment: "",
    suc_name: "",
    campus: "",
    address: ""
  });

  const facultyRanks = [
    "Instructor I", "Instructor II", "Instructor III",
    "Assistant Professor I", "Assistant Professor II", "Assistant Professor III",
    "Assistant Professor IV", "Assistant Professor V",
    "Associate Professor I", "Associate Professor II", "Associate Professor III",
    "Associate Professor IV", "Associate Professor V",
    "Professor I", "Professor II", "Professor III", "Professor IV", "Professor V", "Professor VI",
    "College/University Professor"
  ];

  useEffect(() => {
    AOS.init({ duration: 700, once: true });
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const goToStep2 = () => {
    const requiredStep1 = ["first_name", "last_name", "email", "password"];
    const missing = requiredStep1.find(key => !formData[key]?.toString().trim());
    if (missing) {
      notify.error("Please fill all required personal information before continuing.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.date_of_appointment) {
      notify.error("Please select Date of Appointment.");
      setStep(2);
      setLoading(false);
      return;
    }

    const payload = { 
      ...formData, 
      username: formData.username?.trim() || formData.email?.trim(),
      middle_initial: formData.middle_name
    };

    try {
      const result = await registerFaculty(payload);
      if (result.success) {
        notify.success("Registration successful! Please check your email to verify your account.");
      } else {
        notify.error(result.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      notify.error("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      <div className="login-left-section login-visual-side">
        {/* Visual side holds the background image only as requested */}
      </div>

      <div className="login-right-section login-form-side overflow-auto py-4">
        <Link to="/" className="login-back-btn">
          <i className="bi bi-house-door me-2"></i>
          Back to Home
        </Link>

        <motion.div
          className="login-auth-card w-100 py-2 px-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: "460px" }}
        >
          <div className="text-center mb-4">
            <h2 className="fw-bold text-dark mb-1">Create Account</h2>
            <p className="text-muted small">Step {step} of 2: {step === 1 ? "Personal Profile" : "Academic Background"}</p>
          </div>

          <div className="register-stepper mb-4 mx-auto" style={{ maxWidth: "300px" }}>
            <div className="d-flex justify-content-between position-relative">
                <div className="position-absolute top-50 start-0 translate-middle-y w-100 bg-light shadow-sm" style={{ height: "3px", zIndex: 0 }}>
                    <div className="bg-primary h-100 transition-all" style={{ width: step === 1 ? "0%" : "100%" }}></div>
                </div>
                
                <div className="d-flex flex-column align-items-center" style={{ zIndex: 1 }}>
                    <div className={`step-dot shadow-sm ${step >= 1 ? "active" : ""}`}>
                        <i className={`bi ${step > 1 ? "bi-check-lg" : "bi-person"}`}></i>
                    </div>
                    <span className="mt-2 fw-bold text-uppercase" style={{ fontSize: "0.55rem" }}>Profile</span>
                </div>

                <div className="d-flex flex-column align-items-center" style={{ zIndex: 1 }}>
                    <div className={`step-dot shadow-sm ${step >= 2 ? "active" : ""}`}>
                        <i className="bi bi-briefcase"></i>
                    </div>
                    <span className="mt-2 fw-bold text-uppercase" style={{ fontSize: "0.55rem" }}>Academic</span>
                </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-3">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="row g-2 align-items-end">
                    <div className="col-md-5">
                      <label className="register-label">First Name</label>
                      <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="register-input py-2" placeholder="Juan" required />
                    </div>
                    <div className="col-md-2">
                      <label className="register-label text-center d-block small">M.I.</label>
                      <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} className="register-input text-center py-2 px-0" placeholder="D." maxLength="2" />
                    </div>
                    <div className="col-md-5">
                      <label className="register-label">Last Name</label>
                      <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="register-input py-2" placeholder="Dela Cruz" required />
                    </div>

                    <div className="col-12 mt-2">
                      <label className="register-label">Email Address</label>
                      <div className="position-relative">
                        <i className="bi bi-envelope register-icon"></i>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="register-input icon-ready py-2" placeholder="juan@university.edu" required />
                      </div>
                    </div>
                    
                    <div className="col-12 mt-2">
                      <label className="register-label">Password</label>
                      <div className="position-relative">
                        <i className="bi bi-shield-lock register-icon"></i>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="register-input icon-ready py-2" placeholder="******" required />
                      </div>
                    </div>
                  </div>

                  <button type="button" className="register-next-btn w-100 mt-4 py-2" onClick={goToStep2}>
                    Continue <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="row g-2 align-items-end">
                    <div className="col-md-8">
                        <label className="register-label">HEI Name (Graduated)</label>
                        <input type="text" name="hei_name" value={formData.hei_name} onChange={handleChange} className="register-input py-2" placeholder="University Name" required />
                    </div>
                    <div className="col-md-4">
                        <label className="register-label">Year</label>
                        <input type="number" name="year_graduated" value={formData.year_graduated} onChange={handleChange} className="register-input py-2" placeholder="2020" required />
                    </div>
                    
                    <div className="col-12 mt-1">
                        <label className="register-label">Highest Degree Earned</label>
                        <input type="text" name="degree_name" value={formData.degree_name} onChange={handleChange} className="register-input py-2" placeholder="Master of Science in IT" required />
                    </div>

                    <div className="col-md-6 mt-1">
                        <label className="register-label">Faculty Rank</label>
                        <select name="faculty_rank" value={formData.faculty_rank} onChange={handleChange} className="register-input py-2" required>
                            <option value="">Select Rank</option>
                            {facultyRanks.map(rank => <option key={rank} value={rank}>{rank}</option>)}
                        </select>
                    </div>
                    <div className="col-md-6 mt-1">
                        <label className="register-label">Appointment Date</label>
                        <input type="date" name="date_of_appointment" value={formData.date_of_appointment} onChange={handleChange} className="register-input py-2" required />
                    </div>

                    <div className="col-md-6 mt-1">
                        <label className="register-label">Campus</label>
                        <input type="text" name="campus" value={formData.campus} onChange={handleChange} className="register-input py-2" placeholder="Main Campus" required />
                    </div>
                    <div className="col-md-6 mt-1">
                        <label className="register-label">Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="register-input py-2" placeholder="City, Province" required />
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <button type="button" className="register-back-link-btn py-2 px-3" onClick={() => setStep(1)}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <button type="submit" className="register-submit-btn flex-grow-1 py-2" disabled={loading}>
                        {loading ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</>
                        ) : (
                            <>Complete <i className="bi bi-check2-circle ms-2"></i></>
                        )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="text-center mt-4 mb-0 text-muted small">
            Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none border-bottom border-primary border-2">Sign In</Link>
          </p>
        </motion.div>
      </div>

      <style>{`
        .step-dot {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            transition: all 0.3s ease;
            font-size: 0.8rem;
        }
        .step-dot.active {
            background: #2563eb;
            border-color: #2563eb;
            color: #fff;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        .register-label {
            font-size: 0.65rem;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .register-input {
            width: 100%;
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            border-radius: 10px;
            font-size: 0.85rem;
            transition: all 0.2s ease;
            padding-left: 10px;
            padding-right: 10px;
        }
        .register-input:focus {
            background: #fff;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
            outline: none;
        }
        .register-input.icon-ready {
            padding-left: 38px;
        }
        .register-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
            font-size: 0.95rem;
        }
        .register-next-btn, .register-submit-btn {
            background: #2563eb;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.95rem;
            transition: all 0.2s ease;
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
        }
        .register-next-btn:hover, .register-submit-btn:hover {
            background: #1d4ed8;
            transform: translateY(-1px);
            box-shadow: 0 6px 15px rgba(37, 99, 235, 0.2);
        }
        .register-back-link-btn {
            background: #f1f5f9;
            color: #64748b;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        .register-back-link-btn:hover {
            background: #e2e8f0;
            color: #1e293b;
        }
        .transition-all {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
};

export default FacultyRegister;
