import React from 'react';
import { NavLink, } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/projects',  label: 'Projects',  icon: '📁' },
  { to: '/tasks',     label: 'Task Board', icon: '📋' },
  { to: '/profile',   label: 'Profile',   icon: '👤' },
];

const Sidebar = ({ isOpen }) => {
  const { user, hasRole } = useAuth();
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="brand-icon">⚡</span>
        <span className="brand-name">TaskFlow</span>
      </div>

      {/* User card */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{user?.name}</p>
          <span className={`badge badge-${user?.role}`}>{user?.role}</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        <p className="nav-section-label">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer info */}
      <div className="sidebar-footer">
        <p className="text-muted text-sm">© 2024 TaskFlow</p>
      </div>
    </aside>
  );
};

export default Sidebar;
