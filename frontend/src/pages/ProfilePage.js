import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import './ProfilePage.css';

const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const CrossIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const EditIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const ProfilePage = () => {
  const { user } = useAuth();
  const [form, setForm]     = useState({ name: user?.name || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userAPI.updateProfile(form);
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  return (
    <div className="profile-page">
      <h1 className="page-title" style={{ marginBottom: 24 }}>Profile</h1>

      <div className="profile-hero card">
        <div className="profile-avatar-lg">{initials}</div>
        <div className="profile-hero-info">
          <h2 className="profile-display-name">{user?.name}</h2>
          <p className="text-secondary">{user?.email}</p>
          <div style={{ display:'flex', gap: 10, marginTop: 10, flexWrap:'wrap', alignItems:'center' }}>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            <span className="text-muted text-sm">
              Joined {user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : '—'}
            </span>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => setEditing((e) => !e)}>
          <EditIcon /> {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {editing && (
        <div className="card" style={{ marginTop: 20, maxWidth: 480 }}>
          <div className="card-header">
            <h2 className="card-title">Edit Profile</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
            </div>
            <div style={{ display:'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 20, maxWidth: 480 }}>
        <div className="card-header">
          <h2 className="card-title">Permissions</h2>
        </div>
        <div className="permissions-grid">
          <PermissionRow label="View Projects"     allowed={true} />
          <PermissionRow label="Create Projects"   allowed={['admin','manager'].includes(user?.role)} />
          <PermissionRow label="Delete Projects"   allowed={['admin','manager'].includes(user?.role)} />
          <PermissionRow label="Create Tasks"      allowed={true} />
          <PermissionRow label="Delete Any Task"   allowed={['admin','manager'].includes(user?.role)} />
          <PermissionRow label="Manage Users"      allowed={user?.role === 'admin'} />
        </div>
      </div>
    </div>
  );
};

const PermissionRow = ({ label, allowed }) => (
  <div className="permission-row">
    <span className="text-sm">{label}</span>
    {allowed ? <CheckIcon /> : <CrossIcon />}
  </div>
);

export default ProfilePage;
