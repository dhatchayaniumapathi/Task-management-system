import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { projectAPI, taskAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/tasks/TaskModal';
import socket from '../services/socket';
import './ProjectDetailPage.css';

const EditIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const CalIcon    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const UserIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const TasksIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;

const statusLabel = { todo: 'To Do', inprogress: 'In Progress', completed: 'Completed' };

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [project, setProject]         = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask]       = useState(null);

  useEffect(() => {
    fetchProject();
    fetchUsers();
    socket.emit('joinProject', id);

    // NOTE: taskCreated is intentionally NOT here to prevent duplicate display
    socket.on('taskUpdated', (task) =>
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)))
    );
    socket.on('taskDeleted', ({ taskId }) =>
      setTasks((prev) => prev.filter((t) => t._id !== taskId))
    );

    return () => {
      socket.emit('leaveProject', id);
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
    };
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data } = await projectAPI.getById(id);
      setProject(data.data);
      setTasks(data.data.tasks || []);
    } catch {
      toast.error('Project not found');
      navigate('/projects');
    } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await userAPI.getAll();
      setUsers(data.data);
    } catch {}
  };

  const handleSaveTask = async (formData) => {
    try {
      if (editTask) {
        const { data } = await taskAPI.update(editTask._id, formData);
        setTasks((prev) => prev.map((t) => (t._id === data.data._id ? data.data : t)));
        toast.success('Task updated');
      } else {
        const { data } = await taskAPI.create({ ...formData, projectId: id });
        setTasks((prev) => [data.data, ...prev]);
        toast.success('Task created');
      }
      setShowTaskModal(false);
      setEditTask(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await taskAPI.update(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.data : t)));
    } catch { toast.error('Failed to update status'); }
  };

  if (loading) return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;
  if (!project) return null;

  const columns = ['todo', 'inprogress', 'completed'];
  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/projects">Projects</Link>
        <span className="text-muted"> / </span>
        <span>{project.title}</span>
      </div>

      <div className="project-detail-header">
        <div>
          <h1 className="page-title">{project.title}</h1>
          {project.description && <p className="text-secondary" style={{ marginTop: 4 }}>{project.description}</p>}
          <div className="project-meta">
            <span className={`badge badge-${project.status}`}>{project.status}</span>
            {project.deadline && (
              <span className="text-muted text-sm" style={{ display:'flex', alignItems:'center', gap:4 }}>
                <CalIcon /> {format(new Date(project.deadline), 'MMM d, yyyy')}
              </span>
            )}
            <span className="text-muted text-sm" style={{ display:'flex', alignItems:'center', gap:4 }}>
              <UserIcon /> {project.members?.length || 0} members
            </span>
            <span className="text-muted text-sm" style={{ display:'flex', alignItems:'center', gap:4 }}>
              <TasksIcon /> {tasks.length} tasks
            </span>
          </div>
        </div>
        <button className="btn btn-primary"
          onClick={() => { setEditTask(null); setShowTaskModal(true); }}>
          Add Task
        </button>
      </div>

      <div className="card" style={{ padding: '16px 24px', marginBottom: 24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8, fontSize: 14 }}>
          <span className="font-semibold">Overall Progress</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{project.progress || 0}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${project.progress || 0}%` }} />
        </div>
        <div style={{ display:'flex', gap: 20, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>{tasksByStatus('todo').length} To Do</span>
          <span>{tasksByStatus('inprogress').length} In Progress</span>
          <span>{tasksByStatus('completed').length} Completed</span>
        </div>
      </div>

      <div className="kanban-board">
        {columns.map((status) => (
          <div key={status} className="kanban-column">
            <div className="kanban-column-header">
              <span className={`badge badge-${status}`}>{statusLabel[status]}</span>
              <span className="kanban-count">{tasksByStatus(status).length}</span>
            </div>
            <div className="kanban-tasks">
              {tasksByStatus(status).length === 0 ? (
                <div className="kanban-empty">No tasks here</div>
              ) : (
                tasksByStatus(status).map((task) => (
                  <TaskCard key={task._id} task={task}
                    onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    canEdit={hasRole('admin','manager') || task.assignedTo?._id === user._id}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showTaskModal && (
        <TaskModal task={editTask} projectId={id}
          users={project.members || []}
          onSave={handleSaveTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }} />
      )}
    </div>
  );
};

const nextStatus = { todo: 'inprogress', inprogress: 'completed', completed: 'todo' };
const nextLabel  = { todo: 'Start', inprogress: 'Complete', completed: 'Reopen' };

const TaskCard = ({ task, onEdit, onDelete, onStatusChange, canEdit }) => (
  <div className="task-card">
    <div className="task-card-header">
      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
      {canEdit && (
        <div className="task-actions">
          <button className="btn btn-icon btn-secondary btn-sm" onClick={() => onEdit(task)} title="Edit"><EditIcon /></button>
          <button className="btn btn-icon btn-danger btn-sm" onClick={() => onDelete(task._id)} title="Delete"><TrashIcon /></button>
        </div>
      )}
    </div>
    <p className="task-title">{task.title}</p>
    {task.description && <p className="task-description text-muted text-sm">{task.description}</p>}
    <div className="task-card-footer">
      {task.assignedTo ? (
        <div className="task-assignee">
          <div className="assignee-avatar">{task.assignedTo.name?.charAt(0).toUpperCase()}</div>
          <span className="text-sm text-secondary">{task.assignedTo.name}</span>
        </div>
      ) : (
        <span className="text-sm text-muted">Unassigned</span>
      )}
      <button className="btn btn-secondary btn-sm"
        onClick={() => onStatusChange(task._id, nextStatus[task.status])}>
        {nextLabel[task.status]}
      </button>
    </div>
    {task.deadline && (
      <p className="text-muted text-sm" style={{ marginTop: 6, display:'flex', alignItems:'center', gap: 4 }}>
        <CalIcon /> {format(new Date(task.deadline), 'MMM d')}
      </p>
    )}
  </div>
);

export default ProjectDetailPage;
