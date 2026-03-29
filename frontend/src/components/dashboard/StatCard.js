import React from 'react';
import './StatCard.css';

const icons = {
  tasks: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  progress: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  alert: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

const colorMap = {
  purple: { bg: '#fff7ed', text: '#c2540a', border: '#fed7aa', icon: 'tasks'    },
  blue:   { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', icon: 'progress' },
  green:  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', icon: 'check'    },
  red:    { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: 'alert'    },
};

const StatCard = ({ label, value, color = 'purple' }) => {
  const c = colorMap[color] || colorMap.purple;
  return (
    <div className="stat-card card" style={{ borderColor: c.border }}>
      <div className="stat-icon" style={{ background: c.bg, color: c.text }}>
        {icons[c.icon]}
      </div>
      <div className="stat-body">
        <p className="stat-value" style={{ color: c.text }}>{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
