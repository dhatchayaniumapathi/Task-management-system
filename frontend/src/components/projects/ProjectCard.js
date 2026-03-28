import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import './ProjectCard.css';

const statusColor = { active: 'blue', completed: 'green', 'on-hold': 'amber' };

const ProjectCard = ({ project, onEdit, onDelete, canEdit }) => {
  const membersToShow = project.members?.slice(0, 4) || [];
  const extraMembers  = (project.members?.length || 0) - 4;

  return (
    <div className="project-card card">
      {/* Header row */}
      <div className="project-card-header">
        <span className={`badge badge-${statusColor[project.status]}`}>
          {project.status}
        </span>
        {canEdit && (
          <div className="project-actions">
            <button className="btn btn-icon btn-secondary btn-sm" title="Edit" onClick={() => onEdit(project)}>✏️</button>
            <button className="btn btn-icon btn-danger btn-sm"   title="Delete" onClick={() => onDelete(project._id)}>🗑️</button>
          </div>
        )}
      </div>

      {/* Title & description */}
      <Link to={`/projects/${project._id}`} className="project-title">{project.title}</Link>
      {project.description && (
        <p className="project-description text-secondary text-sm">{project.description}</p>
      )}

      {/* Progress */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
          <span className="text-muted">Progress</span>
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{project.progress || 0}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${project.progress || 0}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="project-footer">
        {/* Member avatars */}
        <div className="member-avatars">
          {membersToShow.map((m) => (
            <div
              key={m._id}
              className="member-avatar"
              title={m.name}
            >
              {m.name?.charAt(0).toUpperCase()}
            </div>
          ))}
          {extraMembers > 0 && (
            <div className="member-avatar extra">+{extraMembers}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          {project.deadline && (
            <span className="text-muted text-sm">
              📅 {format(new Date(project.deadline), 'MMM d, yyyy')}
            </span>
          )}
          <span className="text-muted text-sm">
            {project.taskCount || 0} tasks
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
