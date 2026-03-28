import React from 'react';
import './StatCard.css';

const colorMap = {
  purple: { bg: '#fff7ed', text: '#c2540a', border: '#fed7aa' },
  blue:   { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
  green:  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  red:    { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  amber:  { bg: '#fefce8', text: '#a16207', border: '#fef08a' },
};

const StatCard = ({ label, value, icon, color = 'purple', trend }) => {
  const c = colorMap[color] || colorMap.purple;

  return (
    <div className="stat-card card" style={{ borderColor: c.border }}>
      <div className="stat-icon" style={{ background: c.bg, color: c.text }}>
        {icon}
      </div>
      <div className="stat-body">
        <p className="stat-value" style={{ color: c.text }}>{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
