//frontend/src/components/AnalyticsDashboard.js

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import RecommendationPanel from "./RecommendationPanel";

// --- Design Configuration ---
const COLORS = {
  primary: ['#6366f1', '#818cf8'], // Indigo
  secondary: ['#ec4899', '#f472b6'], // Pink
  success: ['#10b981', '#34d399'], // Emerald
  warning: ['#f59e0b', '#fbbf24'], // Amber
  info: ['#06b6d4', '#22d3ee'], // Cyan
  dark: '#1e293b',
  light: '#f8fafc'
};

const DEFAULT_CAPS = { "KRA I": 100, "KRA II": 100, "KRA III": 100, "KRA IV": 100 };
const KRA_SUB_LABELS = {
  "KRA I": [
    { key: "A", name: "Teaching Effectiveness", cap: 60 },
    { key: "B", name: "Curriculum & Materials", cap: 30 },
    { key: "C", name: "Mentorship/Thesis/Capstone", cap: 10 }
  ],
  "KRA II": [
    { key: "A", name: "Research Outputs", cap: 100 },
    { key: "B", name: "Inventions / Patents", cap: 0 },
    { key: "C", name: "Creative Works", cap: 0 }
  ],
  "KRA III": [
    { key: "A", name: "Service to Institution", cap: 30 },
    { key: "B", name: "Service to Community", cap: 50 },
    { key: "C", name: "Quality of Extension", cap: 20 },
    { key: "D", name: "Bonus Criterion", cap: 0 }
  ],
  "KRA IV": [
    { key: "A", name: "Professional Org Involvement", cap: 20 },
    { key: "B", name: "Continuing Development", cap: 60 },
    { key: "C", name: "Awards & Recognition", cap: 20 },
    { key: "D", name: "Bonus Criterion", cap: 0 }
  ]
};

function safeNum(v) {
  const n = Number(v);
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/analytics/gap-analysis/")
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => { 
        console.error(err); 
        setError(err.response?.data || "Failed to load"); 
        setLoading(false); 
      });
  }, []);

  const normalized = useMemo(() => {
    if (!data) return null;
    
    const summary = data.summary || {};
    const caps = data.caps || DEFAULT_CAPS;
    const subscores = {};

    // Process Subscores
    Object.keys(KRA_SUB_LABELS).forEach(kra => {
      const labels = KRA_SUB_LABELS[kra];
      const kraObj = summary[kra] || {};
      const arr = labels.map((lbl, idx) => {
        const raw = (kraObj && (kraObj[lbl.key] !== undefined ? kraObj[lbl.key] : kraObj[idx])) || 0;
        return { key: lbl.key, name: lbl.name, score: safeNum(raw), cap: lbl.cap || 0 };
      });

      const allZero = arr.every(s => !s.cap);
      if (allZero) {
        const equal = Math.floor((caps[kra] || 100) / Math.max(1, arr.length));
        arr.forEach(s => s.cap = equal);
      }
      subscores[kra] = arr;
    });

    return { 
        subscores, 
        caps, 
        summary,
        promotion: data.promotion || {} 
    };
  }, [data]);

  if (loading) return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden" style={{ background: '#f8fafc' }}>
        {/* Background Effects */}
        <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden">
            <div className="position-absolute top-50 start-50 translate-middle rounded-circle blur-3xl opacity-20" style={{ width: '600px', height: '600px', background: '#6366f1' }}></div>
            <div className="position-absolute top-50 start-50 translate-middle rounded-circle blur-3xl opacity-20" style={{ width: '400px', height: '400px', background: '#ec4899', transform: 'translate(50%, 50%)' }}></div>
        </div>

        <div className="position-relative z-1 text-center">
            <motion.div 
                className="mb-4 position-relative d-inline-block"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="rounded-circle bg-white shadow-lg d-flex align-items-center justify-content-center position-relative z-2" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-bar-chart-fill text-primary fs-1"></i>
                </div>
                <motion.div 
                    className="position-absolute top-50 start-50 translate-middle rounded-circle bg-primary opacity-20"
                    style={{ width: '100px', height: '100px' }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>
            
            <h4 className="fw-bold text-dark mb-2">Analyzing Performance</h4>
            <p className="text-muted mb-4">Gathering your latest metrics and scores...</p>
            
            <div className="progress bg-white shadow-sm rounded-pill overflow-hidden mx-auto" style={{ width: '200px', height: '6px' }}>
                <motion.div 
                    className="progress-bar bg-gradient-primary"
                    style={{ background: 'linear-gradient(90deg, #6366f1, #ec4899)' }}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
        </div>
    </div>
  );

  if (error) {
    const errorMessage = typeof error === "string"
      ? error
      : (error?.error || error?.detail || "Unable to load analytics data.");
    return <div className="p-5 text-center text-danger">{errorMessage}</div>;
  }
  if (!normalized) return null;

  // Process Data for Cards
  const kraCards = Object.keys(normalized.subscores).map(kra => {
    const subs = normalized.subscores[kra];
    const totalScore = safeNum((data.summary && data.summary[kra] && data.summary[kra].Total) || subs.reduce((a,b) => a + b.score, 0));
    const cap = normalized.caps[kra] || DEFAULT_CAPS[kra];
    const pct = cap ? (totalScore / cap) * 100 : 0;
    
    let status = "bad";
    if (pct >= 90) status = "good";
    else if (pct >= 70) status = "warn";

    return { kra, subs, totalScore, cap, pct, status };
  });

  // Extract Promotion Data
  const promo = {
      current_rank: normalized.promotion.current_rank || "Instructor I",
      weighted_score: normalized.promotion.weighted_score || 0,
      projected_rank: normalized.promotion.projected_rank || "Calculating...",
      status_message: normalized.promotion.status_message || "Pending Analysis",
      points_to_next: normalized.promotion.points_to_next_bracket || 0
  };

  return (
    <div className="analytics-dashboard min-vh-100 py-5 position-relative overflow-hidden" style={{ background: '#f1f5f9' }}>
      {/* Ambient Background */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="position-absolute top-0 end-0 rounded-circle blur-3xl opacity-20" style={{ width: '800px', height: '800px', background: '#6366f1', transform: 'translate(30%, -30%)' }}></div>
        <div className="position-absolute bottom-0 start-0 rounded-circle blur-3xl opacity-20" style={{ width: '600px', height: '600px', background: '#ec4899', transform: 'translate(-30%, 30%)' }}></div>
      </div>

      <div className="container position-relative z-1">
        {data?.warning && (
          <div className="alert alert-warning border-0 shadow-sm rounded-4 mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {data.warning}
          </div>
        )}

        <motion.header 
          className="mb-5 d-flex justify-content-between align-items-end"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-1px' }}>NBC 461 Analytics</h1>
            <p className="text-muted mb-0">Cycle 9 Faculty Reclassification & Performance Overview</p>
          </div>
          <div className="d-none d-md-block text-end">
            <div className="small text-uppercase text-muted fw-bold tracking-wide">Current Cycle</div>
            <div className="h5 mb-0 fw-bold text-primary">2023-2026</div>
          </div>
        </motion.header>

        {/* Hero Section - Glassmorphism */}
        <motion.div 
          className="card border-0 shadow-lg rounded-5 overflow-hidden mb-5 position-relative"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white'
          }}
        >
          <div className="position-absolute w-100 h-100" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
          
          <div className="card-body p-4 p-lg-5 position-relative z-1">
            <div className="row align-items-center">
              <div className="col-lg-7 mb-4 mb-lg-0">
                <div className="d-flex flex-wrap gap-3 mb-4">
                  <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 rounded-pill px-3 py-2 backdrop-blur">
                    <span className="text-white-50 small text-uppercase fw-bold">Current</span>
                    <span className="fw-bold">{promo.current_rank}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 bg-white text-primary rounded-pill px-3 py-2 shadow-sm">
                    <i className="bi bi-stars"></i>
                    <span className="small text-uppercase fw-bold">Projected</span>
                    <span className="fw-bold">{promo.projected_rank}</span>
                  </div>
                </div>
                
                <h2 className="display-6 fw-bold mb-3">{promo.status_message}</h2>
                
                {promo.points_to_next > 0 && (
                  <div className="mt-4">
                    <div className="d-flex justify-content-between text-white-50 small mb-2">
                        <span>Progress to next bracket</span>
                        <span>{(promo.weighted_score + promo.points_to_next).toFixed(0)} pts target</span>
                    </div>
                    <div className="progress bg-white bg-opacity-10 rounded-pill" style={{ height: '10px' }}>
                        <motion.div 
                            className="progress-bar bg-warning rounded-pill"
                            initial={{ width: 0 }}
                            animate={{ width: `${(promo.weighted_score % 10) * 10}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </div>
                    <div className="mt-2 small text-white-50">
                        <i className="bi bi-info-circle me-2"></i>
                        Need <strong className="text-white">{promo.points_to_next.toFixed(2)}</strong> more points
                    </div>
                  </div>
                )}
              </div>
              
              <div className="col-lg-5 text-center">
                <div className="position-relative d-inline-block">
                    <motion.div 
                        className="rounded-circle d-flex align-items-center justify-content-center shadow-lg position-relative z-2"
                        style={{ width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)' }}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="text-center">
                            <div className="display-4 fw-bold mb-0">{promo.weighted_score.toFixed(2)}</div>
                            <div className="small text-uppercase tracking-widest opacity-75">Total Points</div>
                        </div>
                    </motion.div>
                    
                    {/* Decorative Rings */}
                    <motion.div 
                        className="position-absolute top-50 start-50 translate-middle rounded-circle border border-white opacity-10"
                        style={{ width: '260px', height: '260px' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div 
                        className="position-absolute top-50 start-50 translate-middle rounded-circle border border-white opacity-10 border-dashed"
                        style={{ width: '320px', height: '320px' }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="row g-4">
            {/* Left Column: Charts & Details */}
            <div className="col-lg-8">
                {/* KRA Breakdown Cards */}
                <div className="row g-4">
                    {kraCards.map((card, index) => (
                        <div key={card.kra} className="col-md-6">
                            <motion.div 
                                className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden group-hover"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(0,0,0,0.1)' }}
                                style={{
                                    background: 'white',
                                    border: '1px solid rgba(0,0,0,0.05)'
                                }}
                            >
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-4">
                                        <div>
                                            <h5 className="fw-bold text-dark mb-1">{card.kra}</h5>
                                            <div className="small text-muted d-flex align-items-center gap-2">
                                                <i className="bi bi-trophy text-warning"></i>
                                                <span>Score: <strong>{card.totalScore.toFixed(2)}</strong> / {card.cap}</span>
                                            </div>
                                        </div>
                                        <div 
                                            className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                            style={{ 
                                                width: '48px', height: '48px', 
                                                background: card.status === 'good' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 
                                                            card.status === 'warn' ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 
                                                            'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                                color: card.status === 'good' ? '#166534' : card.status === 'warn' ? '#b45309' : '#991b1b'
                                            }}
                                        >
                                            <span className="fw-bold">{Math.round(card.pct)}%</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span className="text-muted fw-bold text-uppercase" style={{fontSize: '0.7rem'}}>Overall Progress</span>
                                        </div>
                                        <div className="progress" style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '10px' }}>
                                            <motion.div 
                                                className="progress-bar rounded-pill"
                                                style={{ 
                                                    background: card.status === 'good' ? 'linear-gradient(90deg, #10b981, #34d399)' : 
                                                                card.status === 'warn' ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 
                                                                'linear-gradient(90deg, #ef4444, #f87171)'
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, card.pct)}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex flex-column gap-3">
                                        {card.subs.map((s, i) => {
                                            const subPct = s.cap ? Math.min(100, (s.score / s.cap) * 100) : 0;
                                            return (
                                                <div key={s.key} className="position-relative">
                                                    <div className="d-flex align-items-center justify-content-between small mb-1">
                                                        <span className="text-dark fw-medium text-truncate" style={{ maxWidth: '75%' }}>{s.name}</span>
                                                        <span className="fw-bold text-primary">{s.score.toFixed(1)}</span>
                                                    </div>
                                                    <div className="progress" style={{ height: '4px', backgroundColor: '#f8fafc' }}>
                                                        <motion.div 
                                                            className="progress-bar rounded-pill bg-primary opacity-75"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${subPct}%` }}
                                                            transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Gap Analysis */}
            <div className="col-lg-4">
                <motion.div 
                    className="card border-0 rounded-4 h-100 overflow-hidden position-relative shadow-lg"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{ 
                        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                        color: 'white'
                    }}
                >
                    {/* Decorative Elements */}
                    <div className="position-absolute top-0 end-0 p-3 opacity-10">
                        <i className="bi bi-grid-3x3-gap-fill display-1"></i>
                    </div>

                    <div className="card-header bg-transparent border-0 px-4 pt-4 pb-2 position-relative z-1">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="fw-bold text-uppercase text-white mb-1 tracking-wide">Gap Analysis</h6>
                                <p className="text-white-50 small mb-0">Target vs Actual</p>
                            </div>
                            <div className="bg-white bg-opacity-10 rounded-circle p-2">
                                <i className="bi bi-bullseye text-warning"></i>
                            </div>
                        </div>
                    </div>

                    <div className="card-body px-4 pb-4 pt-2 position-relative z-1 custom-scrollbar" style={{ maxHeight: '800px', overflowY: 'auto' }}>
                        <div className="d-flex flex-column gap-3">
                            {kraCards.map((k, idx) => {
                                const gap = Math.max(0, (k.cap || 100) - k.totalScore);
                                const pct = k.cap ? Math.min(100, (k.totalScore / k.cap) * 100) : 0;
                                const isFull = pct >= 100;
                                
                                return (
                                    <motion.div 
                                        key={k.kra}
                                        className="p-3 rounded-4 position-relative overflow-hidden"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + idx * 0.1 }}
                                        style={{ 
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="fw-bold text-white small">{k.kra}</span>
                                            {isFull ? (
                                                <span className="badge bg-success bg-opacity-20 text-success rounded-pill px-2 py-1" style={{fontSize: '0.6rem'}}>MAXED</span>
                                            ) : (
                                                <span className="badge bg-warning bg-opacity-20 text-black rounded-pill px-2 py-1" style={{fontSize: '0.6rem'}}>-{gap.toFixed(0)}</span>
                                            )}
                                        </div>

                                        <div className="d-flex align-items-end justify-content-between mb-2">
                                            <div className="display-6 fw-bold lh-1">{Math.round(pct)}<span className="fs-6 text-white-50">%</span></div>
                                            <div className="text-end">
                                                <div className="small text-white-50">Score</div>
                                                <div className="fw-bold">{k.totalScore.toFixed(1)}</div>
                                            </div>
                                        </div>

                                        <div className="progress" style={{ height: '4px', background: 'rgba(255,255,255,0.1)' }}>
                                            <motion.div 
                                                className="progress-bar"
                                                style={{ 
                                                    background: isFull ? '#10b981' : 'linear-gradient(90deg, #6366f1, #818cf8)'
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 1, delay: 0.8 + idx * 0.1 }}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-4 pt-3 border-top border-white border-opacity-10 text-center">
                            <p className="small text-white-50 mb-0">
                                Total Points Missing: <span className="text-white fw-bold">{kraCards.reduce((sum, k) => sum + Math.max(0, k.cap - k.totalScore), 0).toFixed(0)}</span>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>

        {normalized && (
          <motion.div
            className="mt-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <RecommendationPanel data={normalized} />
          </motion.div>
        )}
      </div>
    </div>
  );
}