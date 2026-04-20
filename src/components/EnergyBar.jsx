import React from 'react';

/**
 * EnergyBar Component
 * Renders a charging bar that changes color and pulses as it fills.
 * 
 * @param {number} percentage - 0 to 100
 * @param {boolean} isCharging - whether to show the charging pulse effect
 */
export default function EnergyBar({ percentage, isCharging }) {
  // Determine color based on threshold
  let barColor = '#f1c40f'; // Yellow
  if (percentage >= 100) barColor = 'linear-gradient(45deg, #f1c40f, #e67e22, #e74c3c, #9b59b6, #3498db, #2ecc71)';
  else if (percentage >= 80) barColor = '#e74c3c'; // Red
  else if (percentage >= 50) barColor = '#e67e22'; // Orange
  
  const fillStyle = {
    width: `${Math.min(percentage, 100)}%`,
    background: barColor,
    boxShadow: percentage >= 80 ? '0 0 15px rgba(231, 76, 60, 0.6)' : 'none'
  };

  return (
    <div className={`energy-bar-container ${percentage >= 100 ? 'maxed' : ''}`}>
      <div className="energy-bar-label">
        <span>ENERGY</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="energy-bar-track">
        <div 
          className={`energy-bar-fill ${isCharging ? 'charging' : ''}`} 
          style={fillStyle}
        >
          {percentage >= 100 && <div className="energy-sparkle"></div>}
        </div>
      </div>
    </div>
  );
}
