import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { taskAPI, projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/tasks/TaskModal';
import './TaskBoardPage.css';

const COLUMNS = [
  { id: 'todo',       label: 'To Do',       color: '#64748b' },
  { id: 'inprogress', label: 'In Progress',  color: '#2563eb' },
  { id: 'completed',  label: 'Completed',    color: '#16a34a' },
];

const TaskBoardPage = () => {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask]  = useState(null);
  const [filterProject, setFilterProject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [tRes, pRes, uRes] = await Promise.all([
        taskAPI.getAll(),
        projectAPI.getAll(),
        userAPI.getAll(),
      ]);
      setTasks(tRes.data.data);
      setProjects(pRes.data.data);
      setUsers(uRes.data.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Apply active filters
  const filteredTasks = tasks.filter((t) => {
    if (filterProject && t.projectId?._id !== filterProject) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = (status) => filteredTasks.filter((t) => t.status === status);

  // Handle drag-and-drop between columns
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await taskAPI.update(draggableId, { status: newStatus });
      toast.success(`Task moved to ${COLUMNS.find((c) => c.id === newStatus)?.label}`);
    } catch {
      // Rollback on error
      setTasks((prev) =>
        prev.map((t) => (t._id === draggableId ? { ...t, status: source.droppableId } : t))
      );
      toast.error('Failed to update task status');
    }
  };

  const handleSaveTask = async (formData) => {
    try {
      if (editTask) {
        const { data } = await taskAPI.update(editTask._id, formData);
        setTasks((prev) => prev.map((t) => (t._id === data.data._id ? data.data : t)));
        toast.success('Task updated');
      } else {
        const { data } = await taskAPI.create(formData);
        setTasks((prev) => [data.data, ...prev]);
        toast.success('Task created');
      }
      setShowModal(false);
      setEditTask(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (loading) {
    return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="board-header">
        <div>
          <h1 className="page-title">Task Board</h1>
          <p className="text-secondary">{filteredTasks.length} tasks across all projects</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditTask(null); setShowModal(true); }}
        >
          + New Task
        </button>
      </div>

      {/* Filters */}
      <div className="board-filters">
        <select
          className="form-control"
          style={{ width: 220 }}
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.title}</option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: 160 }}
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        {(filterProject || filterPriority) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setFilterProject(''); setFilterPriority(''); }}
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* Drag-and-drop Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="dnd-board">
          {COLUMNS.map((col) => (
            <div key={col.id} className="dnd-column">
              {/* Column header */}
              <div className="dnd-column-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="col-dot" style={{ background: col.color }} />
                  <span className="col-label">{col.label}</span>
                </div>
                <span className="kanban-count">{tasksByStatus(col.id).length}</span>
              </div>

              {/* Droppable zone */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`dnd-tasks ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                  >
                    {tasksByStatus(col.id).length === 0 && !snapshot.isDraggingOver && (
                      <div className="kanban-empty">Drop tasks here</div>
                    )}

                    {tasksByStatus(col.id).map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`dnd-task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <DndTaskCard
                              task={task}
                              onEdit={(t) => { setEditTask(t); setShowModal(true); }}
                              onDelete={handleDelete}
                              canEdit={hasRole('admin', 'manager') || task.assignedTo?._id === user._id}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {showModal && (
        <TaskModal
          task={editTask}
          projectId={filterProject || projects[0]?._id}
          users={users}
          onSave={handleSaveTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
        />
      )}
    </div>
  );
};

/* ── Drag-and-drop task card ── */
const DndTaskCard = ({ task, onEdit, onDelete, canEdit }) => (
  <div>
    <div className="dnd-card-header">
      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
      {canEdit && (
        <div className="task-actions">
          <button className="btn btn-icon btn-secondary btn-sm" onClick={() => onEdit(task)} title="Edit">✏️</button>
          <button className="btn btn-icon btn-danger btn-sm" onClick={() => onDelete(task._id)} title="Delete">🗑️</button>
        </div>
      )}
    </div>

    <p className="dnd-task-title">{task.title}</p>

    {task.description && (
      <p className="dnd-task-desc text-muted">{task.description}</p>
    )}

    <div className="dnd-task-meta">
      {task.projectId && (
        <span className="dnd-project-tag">{task.projectId?.title}</span>
      )}
      {task.deadline && (
        <span className="text-muted" style={{ fontSize: 11 }}>
          📅 {format(new Date(task.deadline), 'MMM d')}
        </span>
      )}
    </div>

    {task.assignedTo && (
      <div className="dnd-assignee">
        <div className="assignee-avatar">{task.assignedTo.name?.charAt(0).toUpperCase()}</div>
        <span className="text-sm text-secondary">{task.assignedTo.name}</span>
      </div>
    )}
  </div>
);

export default TaskBoardPage;
