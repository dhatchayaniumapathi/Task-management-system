import React, { useState, useEffect } from 'react';

const ProjectModal = ({ project, users, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    status: 'active',
    members: [],
  });
  const [saving, setSaving] = useState(false);

  // Pre-fill form when editing an existing project
  useEffect(() => {
    if (project) {
      setForm({
        title: project.title || '',
        description: project.description || '',
        deadline: project.deadline ? project.deadline.split('T')[0] : '',
        status: project.status || 'active',
        members: project.members?.map((m) => m._id || m) || [],
      });
    }
  }, [project]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Toggle a user in/out of the members array
  const toggleMember = (userId) => {
    setForm((f) => ({
      ...f,
      members: f.members.includes(userId)
        ? f.members.filter((id) => id !== userId)
        : [...f.members, userId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{project ? 'Edit Project' : 'New Project'}</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input
                name="title"
                className="form-control"
                placeholder="e.g. Website Redesign"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-control"
                placeholder="What is this project about?"
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  className="form-control"
                  value={form.deadline}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Team members multi-select */}
            <div className="form-group">
              <label className="form-label">Team Members</label>
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {users.map((u) => (
                  <label
                    key={u._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background var(--transition)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <input
                      type="checkbox"
                      checked={form.members.includes(u._id)}
                      onChange={() => toggleMember(u._id)}
                      style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                    />
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.role}</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-muted text-sm mt-1">{form.members.length} member(s) selected</p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
