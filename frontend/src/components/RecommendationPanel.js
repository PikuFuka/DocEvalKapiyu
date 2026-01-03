import React, { useMemo } from 'react';
import { generateRecommendations } from '../services/RecommendationEngine';

export default function RecommendationPanel({ data }) {
  // Generate recommendations only when data changes
  const recs = useMemo(() => generateRecommendations(data), [data]);

  return (
    <div className="recommendation-section">
      <div className="rec-header-group">
        <h3>🚀 AI Strategic Advice</h3>
        <p className="rec-subtitle">Prioritized actions to maximize your faculty evaluation score.</p>
      </div>

      <div className="rec-grid">
        {recs.map((rec, index) => (
          <div key={index} className={`rec-card ${rec.color}`}>
            <div className="rec-top">
              <span className={`badge ${rec.color}`}>{rec.type}</span>
              <span className="impact-score">{rec.score}</span>
            </div>
            
            <h4 className="rec-title">{rec.title}</h4>
            <p className="rec-desc">{rec.desc}</p>
            
            <div className="rec-footer">
              <div className="rec-category">
                {/* Simple SVG Icon for visual context */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                {rec.category}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}