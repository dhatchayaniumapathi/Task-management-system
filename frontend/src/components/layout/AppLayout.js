import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const AppLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Join user's personal socket room for targeted notifications
  useEffect(() => {
    if (user && socket.connected) {
      socket.emit('joinUserRoom', user._id);
    }
  }, [user]);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content" style={{ marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '0' }}>
        <Navbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
