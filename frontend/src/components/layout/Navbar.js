import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import socket from '../../services/socket';
import './Navbar.css';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Real-time notifications via socket
    socket.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get initials for avatar
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="btn btn-icon btn-secondary" onClick={onToggleSidebar} title="Toggle sidebar">
          ☰
        </button>
        <span className="navbar-brand">⚡ TaskFlow</span>
      </div>

      <div className="navbar-right">
        {/* Notification bell */}
        <div className="notif-wrapper">
          <button className="btn btn-icon btn-secondary notif-btn" onClick={() => { setShowNotif((s) => !s); setShowProfile(false); }}>
            🔔
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn btn-sm" onClick={handleMarkRead} style={{ fontSize: 12 }}>
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
                      <span className="notif-time text-muted text-sm">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="profile-wrapper">
          <button
            className="profile-btn"
            onClick={() => { setShowProfile((s) => !s); setShowNotif(false); }}
          >
            <div className="avatar">{initials}</div>
            <div className="profile-info">
              <span className="profile-name">{user?.name}</span>
              <span className="profile-role text-muted text-sm">{user?.role}</span>
            </div>
          </button>

          {showProfile && (
            <div className="profile-dropdown">
              <Link to="/profile" className="dropdown-item" onClick={() => setShowProfile(false)}>
                👤 Profile
              </Link>
              <button className="dropdown-item danger" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showNotif || showProfile) && (
        <div className="dropdown-backdrop" onClick={() => { setShowNotif(false); setShowProfile(false); }} />
      )}
    </nav>
  );
};

export default Navbar;
