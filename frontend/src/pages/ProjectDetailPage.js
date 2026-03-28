import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { projectAPI, taskAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/tasks/TaskModal';
import socket from '../services/socket';
import './ProjectDetailPage.css';

const statusLabel = { todo: 'To Do', inprogress: 'In Progress', completed: 'Completed' };

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => {
    fetchProject();
    fetchUsers();

    // Join this project's socket room for real-time task updates
    socket.emit('joinProject', id);

    socket.on('taskCreated', (task) => setTasks((prev) => [task, ...prev]));
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
    } finally {
      setLoading(false);
    }
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
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await taskAPI.update(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.data : t)));
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;
  }

  if (!project) return null;

  const columns = ['todo', 'inprogress', 'completed'];
  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/projects" className="text-secondary">Projects</Link>
        <span className="text-muted"> / </span>
        <span>{project.title}</span>
      </div>

      {/* Project header */}
      <div className="project-detail-header">
        <div>
          <h1 className="page-title">{project.title}</h1>
          {project.description && <p className="text-secondary" style={{ marginTop: 4 }}>{project.description}</p>}
          <div className="project-meta">
            <span className={`badge badge-${project.status}`}>{project.status}</span>
            {project.deadline && (
              <span className="text-muted text-sm">
                📅 Due {format(new Date(project.deadline), 'MMM d, yyyy')}
              </span>
            )}
            <span className="text-muted text-sm">👥 {project.members?.length || 0} members</span>
            <span className="text-muted text-sm">📋 {tasks.length} tasks</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => { setEditTask(null); setShowTaskModal(true); }}
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
          <span className="font-semibold">Overall Progress</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{project.progress || 0}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${project.progress || 0}%` }} />
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>📌 {tasksByStatus('todo').length} To Do</span>
          <span>🔄 {tasksByStatus('inprogress').length} In Progress</span>
          <span>✅ {tasksByStatus('completed').length} Completed</span>
        </div>
      </div>

      {/* Kanban columns */}
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
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    canEdit={hasRole('admin', 'manager') || task.assignedTo?._id === user._id}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={id}
          users={project.members || []}
          onSave={handleSaveTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
        />
      )}
    </div>
  );
};

/* ── Inline TaskCard for this view ── */
const priorityColor = { low: 'low', medium: 'medium', high: 'high' };

const TaskCard = ({ task, onEdit, onDelete, onStatusChange, canEdit }) => {
  const nextStatus = { todo: 'inprogress', inprogress: 'completed', completed: 'todo' };
  const nextLabel  = { todo: 'Start', inprogress: 'Complete', completed: 'Reopen' };

  return (
    <div className="task-card">
      <div className="task-card-header">
        <span className={`badge badge-${priorityColor[task.priority]}`}>{task.priority}</span>
        {canEdit && (
          <div className="task-actions">
            <button className="btn btn-icon btn-secondary btn-sm" onClick={() => onEdit(task)} title="Edit">✏️</button>
            <button className="btn btn-icon btn-danger btn-sm" onClick={() => onDelete(task._id)} title="Delete">🗑️</button>
          </div>
        )}
      </div>

      <p className="task-title">{task.title}</p>
      {task.description && (
        <p className="task-description text-muted text-sm">{task.description}</p>
      )}

      <div className="task-card-footer">
        {task.assignedTo ? (
          <div className="task-assignee">
            <div className="assignee-avatar">{task.assignedTo.name?.charAt(0).toUpperCase()}</div>
            <span className="text-sm text-secondary">{task.assignedTo.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted">Unassigned</span>
        )}

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onStatusChange(task._id, nextStatus[task.status])}
        >
          {nextLabel[task.status]}
        </button>
      </div>

      {task.deadline && (
        <p className="text-muted text-sm" style={{ marginTop: 6 }}>
          📅 {format(new Date(task.deadline), 'MMM d')}
        </p>
      )}
    </div>
  );
};

export default ProjectDetailPage;
