import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectModal from '../components/projects/ProjectModal';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const { hasRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [search, setSearch]           = useState('');

  useEffect(() => { fetchProjects(); fetchUsers(); }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await projectAPI.getAll();
      setProjects(data.data);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await userAPI.getAll();
      setUsers(data.data);
    } catch {}
  };

  const handleSave = async (formData) => {
    try {
      if (editProject) {
        const { data } = await projectAPI.update(editProject._id, formData);
        setProjects((prev) => prev.map((p) => (p._id === data.data._id ? data.data : p)));
        toast.success('Project updated');
      } else {
        const { data } = await projectAPI.create(formData);
        setProjects((prev) => [data.data, ...prev]);
        toast.success('Project created');
      }
      setShowModal(false);
      setEditProject(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save project'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectAPI.delete(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete project'); }
  };

  const handleEdit = (project) => { setEditProject(project); setShowModal(true); };

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-secondary">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {hasRole('admin', 'manager') && (
          <button className="btn btn-primary"
            onClick={() => { setEditProject(null); setShowModal(true); }}>
            New Project
          </button>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <input className="form-control" placeholder="Search projects..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }} />
      </div>

      {loading ? (
        <div className="loading-screen" style={{ height: '40vh' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ height: '40vh' }}>
          <h3>{search ? 'No matching projects' : 'No projects yet'}</h3>
          <p>{!search && hasRole('admin','manager') && 'Create your first project to get started.'}</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((project) => (
            <ProjectCard key={project._id} project={project}
              onEdit={handleEdit} onDelete={handleDelete}
              canEdit={hasRole('admin','manager')} />
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal project={editProject} users={users}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditProject(null); }} />
      )}
    </div>
  );
};

export default ProjectsPage;
