import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const ProjectProgress = ({ projects }) => {
  if (!projects.length) {
    return (
      <div className="card empty-state" style={{ padding: '40px 20px' }}>
        <div className="icon">📁</div>
        <h3>No projects yet</h3>
        <p>Projects you're part of will appear here.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {projects.map((project) => (
        <Link
          key={project._id}
          to={`/projects/${project._id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              transition: 'background var(--transition)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{project.title}</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                {project.progress}%
              </span>
            </div>

            <div className="progress-bar" style={{ marginBottom: 8 }}>
              <div className="progress-fill" style={{ width: `${project.progress}%` }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{project.taskCount || 0} tasks · {project.completedCount || 0} done</span>
              {project.deadline && (
                <span>Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ProjectProgress;
