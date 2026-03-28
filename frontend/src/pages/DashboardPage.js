import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import RecentTasks from '../components/dashboard/RecentTasks';
import ProjectProgress from '../components/dashboard/ProjectProgress';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [projects, setProjects]   = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          projectAPI.getAll(),
          taskAPI.getAll(),
        ]);
        setProjects(pRes.data.data);
        setTasks(tRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute stats from tasks
  const myTasks       = tasks.filter((t) => t.assignedTo?._id === user._id);
  const todoCount     = myTasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = myTasks.filter((t) => t.status === 'inprogress').length;
  const completedCount  = myTasks.filter((t) => t.status === 'completed').length;
  const highPriority    = myTasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;

  if (loading) {
    return (
      <div className="loading-screen" style={{ height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-secondary">Here's what's happening with your projects today.</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          + New Project
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard label="My Tasks"        value={myTasks.length}    icon="📋" color="purple" />
        <StatCard label="In Progress"     value={inProgressCount}   icon="🔄" color="blue"   />
        <StatCard label="Completed"       value={completedCount}    icon="✅" color="green"  />
        <StatCard label="High Priority"   value={highPriority}      icon="🔥" color="red"    />
      </div>

      {/* Two-column section */}
      <div className="dashboard-grid">
        <div>
          <div className="section-header">
            <h2 className="section-title">My Recent Tasks</h2>
            <Link to="/tasks" className="btn btn-secondary btn-sm">View all</Link>
          </div>
          <RecentTasks tasks={myTasks.slice(0, 6)} />
        </div>

        <div>
          <div className="section-header">
            <h2 className="section-title">Project Progress</h2>
            <Link to="/projects" className="btn btn-secondary btn-sm">View all</Link>
          </div>
          <ProjectProgress projects={projects.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

export default DashboardPage;
