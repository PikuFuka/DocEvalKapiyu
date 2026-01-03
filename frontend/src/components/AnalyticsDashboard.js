//frontend/src/components/AnalyticsDashboard.js

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import api from "../services/api";
import RecommendationPanel from "./RecommendationPanel";

// --- Design Configuration ---
const CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"]; 

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <div className="tooltip-items">
            {payload.map((entry, index) => (
                <div key={index} className="tooltip-item" style={{ color: entry.color }}>
                    <span className="bullet" style={{backgroundColor: entry.color}}></span>
                    {entry.name}: <strong>{Number(entry.value).toFixed(2)}</strong>
                </div>
            ))}
        </div>
      </div>
    );
  }
  return null;
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
        promotion: data.promotion || {} // Ensure promotion data is passed
    };
  }, [data]);

  if (loading) return <div className="analytics-loading"><div className="spinner"></div><p>Calculating NBC 461 Metrics...</p></div>;
  if (error) return <div className="analytics-error">Unable to load analytics data.</div>;
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

  // Process Data for Bar Chart
  const stackedData = Object.keys(normalized.subscores).map(kra => {
    const entry = { label: kra };
    normalized.subscores[kra].forEach(s => { entry[s.key] = s.score; });
    return entry;
  });

  // Extract Promotion Data with defaults
  const promo = {
      current_rank: normalized.promotion.current_rank || "Instructor I",
      weighted_score: normalized.promotion.weighted_score || 0,
      projected_rank: normalized.promotion.projected_rank || "Calculating...",
      status_message: normalized.promotion.status_message || "Pending Analysis",
      points_to_next: normalized.promotion.points_to_next_bracket || 0
  };

  return (
    <div className="analytics-dashboard">
      <header className="dashboard-header">
        <div>
            <h1>NBC 461 Evaluation</h1>
            <p className="subtitle">Cycle 9 Faculty Reclassification Analytics</p>
        </div>
        <div className="header-actions">
            <span className="rank-badge current">
                Current: <strong>{promo.current_rank}</strong>
            </span>
        </div>
      </header>

      {/* --- PROMOTION PREDICTION CARD (NEW) --- */}
      <section className="promotion-hero">
         <div className="promo-card">
            <div className="promo-main">
                {/* Left Side: Score */}
                <div className="promo-score">
                    <span className="score-lbl">Weighted Score</span>
                    <span className="score-val">{promo.weighted_score.toFixed(2)}</span>
                    <span className="score-max">/ 100.00</span>
                </div>
                
                {/* Right Side: Details & Progress */}
                <div className="promo-details">
                    <h3>Projected Rank: <span className="highlight">{promo.projected_rank}</span></h3>
                    <p className="promo-status">{promo.status_message}</p>
                    
                    {/* Visual Bracket Progress */}
                    {promo.points_to_next > 0 ? (
                        <div className="bracket-progress">
                           <div className="bracket-info">
                              <span>Next Bracket (+{promo.points_to_next.toFixed(2)} pts)</span>
                              <span>Target: {(promo.weighted_score + promo.points_to_next).toFixed(0)}</span>
                           </div>
                           <div className="progress-bar-bg">
                              {/* Calculate rough percentage of the 10-point bracket filled */}
                              <div 
                                className="progress-bar-fill" 
                                style={{width: `${(promo.weighted_score % 10) * 10}%`}}
                              ></div>
                           </div>
                        </div>
                    ) : (
                        <div className="bracket-success">Max Sub-rank Bracket Reached</div>
                    )}
                </div>
            </div>
         </div>
      </section>

      {/* Main Grid: KRA Tiles */}
      <section className="kra-grid">
        {kraCards.map((card, index) => (
          <div key={card.kra} className={`kra-tile ${card.status}`} style={{ animationDelay: `${index * 100}ms` }}>
            <div className="tile-header">
              <span className="kra-badge">{card.kra}</span>
              <div className="score-circle">
                 <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle" strokeDasharray={`${card.pct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                 </svg>
                 <span className="score-text">{Math.round(card.pct)}%</span>
              </div>
            </div>

            <div className="tile-main-score">
                <span className="current">{card.totalScore.toFixed(2)}</span>
                <span className="cap">/ {card.cap}</span>
            </div>

            <div className="tile-sub-list">
              {card.subs.map((s) => {
                const percent = s.cap ? Math.min(100, (s.score / s.cap) * 100) : 0;
                return (
                  <div className="sub-item" key={s.key}>
                    <div className="sub-info">
                        <span className="sub-name">{s.name}</span>
                        <span className="sub-val">{s.score.toFixed(1)}/{s.cap}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Analytics Row: Charts & Gaps */}
      <section className="analytics-row">
        {/* Chart Tile */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>Composition Breakdown</h3>
            <span className="card-tag">Stacked View</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stackedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" tick={{fontSize: 12, fill: '#64748b'}} width={60} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }}/>
                <Bar dataKey="A" stackId="a" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} barSize={32} />
                <Bar dataKey="B" stackId="a" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} barSize={32} />
                <Bar dataKey="C" stackId="a" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} barSize={32} />
                <Bar dataKey="D" stackId="a" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gap Analysis Tile */}
        <div className="card gap-card">
          <div className="card-header">
            <h3>Opportunity Gaps</h3>
            <span className="card-tag alert">Action Needed</span>
          </div>
          <div className="gap-list">
            {kraCards.map(k => {
              const gap = Math.max(0, (k.cap || 100) - k.totalScore);
              const pctGap = k.cap ? (gap / k.cap) * 100 : 0;
              return (
                <div key={k.kra} className="gap-item">
                  <div className="gap-info">
                    <span className="gap-label">{k.kra}</span>
                    <span className="gap-value">Missing <strong>{gap.toFixed(2)}</strong> pts</span>
                  </div>
                  <div className="gap-visual">
                    <div className="gap-line-bg">
                        <div className="gap-line-fill" style={{width: `${pctGap}%`}}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {normalized && <RecommendationPanel data={normalized} />}
    </div>
  );
}