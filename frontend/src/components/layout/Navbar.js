import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import socket from '../../services/socket';
import './Navbar.css';

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif]     = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchNotifications();
    socket.on('notification', (notif) => setNotifications((prev) => [notif, ...prev]));
    return () => socket.off('notification');
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await userAPI.getNotifications();
      setNotifications(data.data);
    } catch {}
  };

  const handleMarkRead = async () => {
    await userAPI.markNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="btn btn-icon btn-secondary" onClick={onToggleSidebar} title="Toggle sidebar">
          <MenuIcon />
        </button>
        <span className="navbar-brand">TaskFlow</span>
      </div>

      <div className="navbar-right">
        <div className="notif-wrapper">
          <button className="btn btn-icon btn-secondary notif-btn"
            onClick={() => { setShowNotif((s) => !s); setShowProfile(false); }}>
            <BellIcon />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn btn-sm btn-secondary" onClick={handleMarkRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <p className="notif-empty">No notifications yet</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                      <p className="notif-message">{n.message}</p>
                      <span className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="profile-wrapper">
          <button className="profile-btn"
            onClick={() => { setShowProfile((s) => !s); setShowNotif(false); }}>
            <div className="avatar">{initials}</div>
            <div className="profile-info">
              <span className="profile-name">{user?.name}</span>
              <span className="profile-role">{user?.role}</span>
            </div>
          </button>

          {showProfile && (
            <div className="profile-dropdown">
              <Link to="/profile" className="dropdown-item" onClick={() => setShowProfile(false)}>
                <UserIcon /> Profile
              </Link>
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogoutIcon /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {(showNotif || showProfile) && (
        <div className="dropdown-backdrop" onClick={() => { setShowNotif(false); setShowProfile(false); }} />
      )}
    </nav>
  );
};

export default Navbar;
