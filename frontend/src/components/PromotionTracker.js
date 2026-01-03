import React from 'react';

export default function PromotionTracker({ promotion }) {
  if (!promotion) return null;

  const { 
    current_rank, 
    predicted_rank, 
    weighted_score, 
    increments_earned, 
    points_to_next_increment 
  } = promotion;

  // Calculate progress bar width based on Score Brackets (0 to 100)
  const progressPercent = Math.min(100, Math.max(0, weighted_score));

  return (
    <div className="card promotion-card">
      <div className="card-header">
        <h3>Career Progression</h3>
        <span className="card-tag">NBC 461 Cycle 9</span>
      </div>
      
      <div className="promotion-summary">
        <div className="rank-badge current">
          <span className="label">Current</span>
          <span className="val">{current_rank}</span>
        </div>
        
        <div className="arrow-indicator">
          <div className="arrow-line"></div>
          <span className="arrow-text">
            {increments_earned > 0 ? `+${increments_earned} Sub-ranks` : "No Movement"}
          </span>
          <div className="arrow-head"></div>
        </div>

        <div className="rank-badge target">
          <span className="label">Projected</span>
          <span className="val">{predicted_rank}</span>
        </div>
      </div>

      <div className="score-meter-container">
        <div className="score-labels">
            <span>Weighted Score: <strong>{weighted_score.toFixed(2)}</strong></span>
            <span>Target Next Bracket: <strong>{promotion.next_bracket_min}</strong></span>
        </div>
        <div className="meter-track">
            {/* Markers for Bracket Thresholds: 41, 51, 61, 71, 81, 91 */}
            {[41, 51, 61, 71, 81, 91].map(mk => (
                <div key={mk} className="meter-tick" style={{left: `${mk}%`}} title={`Tier ${mk}`}></div>
            ))}
            <div className="meter-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="meter-footer">
            {points_to_next_increment > 0 ? (
                <span className="gap-alert">
                    ⚠️ You need <strong>{points_to_next_increment}</strong> more points to gain another rank increment.
                </span>
            ) : (
                <span className="success-alert">🎉 Max increments reached!</span>
            )}
        </div>
      </div>
    </div>
  );
}