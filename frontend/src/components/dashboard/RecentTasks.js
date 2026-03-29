import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const priorityIcon = { high: '🔴', medium: '🟡', low: '🟢' };

const RecentTasks = ({ tasks }) => {
  if (!tasks.length) {
    return (
      <div className="card empty-state" style={{ padding: '40px 20px' }}>
        <div className="icon">📋</div>
        <h3>No tasks yet</h3>
        <p>Tasks assigned to you will appear here.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {tasks.map((task, i) => (
        <div
          key={task._id}
          style={{
            padding: '14px 18px',
            borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 14 }}>{priorityIcon[task.priority]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
              }}
            >
              {task.title}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {task.projectId?.title}
              {task.deadline && ` · Due ${format(new Date(task.deadline), 'MMM d')}`}
            </p>
          </div>
          <span className={`badge badge-${task.status}`}>
            {task.status === 'inprogress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RecentTasks;
