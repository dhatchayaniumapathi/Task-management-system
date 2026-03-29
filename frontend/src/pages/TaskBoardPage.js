import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { taskAPI, projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/tasks/TaskModal';
import './TaskBoardPage.css';

const EditIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const CalIcon   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

const COLUMNS = [
  { id: 'todo',       label: 'To Do',      color: '#94a3b8' },
  { id: 'inprogress', label: 'In Progress', color: '#3b82f6' },
  { id: 'completed',  label: 'Completed',   color: '#22c55e' },
];

const TaskBoardPage = () => {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editTask, setEditTask]     = useState(null);
  const [filterProject, setFilterProject]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [tRes, pRes, uRes] = await Promise.all([
        taskAPI.getAll(), projectAPI.getAll(), userAPI.getAll(),
      ]);
      setTasks(tRes.data.data);
      setProjects(pRes.data.data);
      setUsers(uRes.data.data);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterProject && t.projectId?._id !== filterProject) return false;
    if (filterPriority && t.priority !== filterPriority)     return false;
    return true;
  });

  const tasksByStatus = (status) => filteredTasks.filter((t) => t.status === status);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStatus = destination.droppableId;
    setTasks((prev) => prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t)));
    try {
      await taskAPI.update(draggableId, { status: newStatus });
      toast.success(`Moved to ${COLUMNS.find((c) => c.id === newStatus)?.label}`);
    } catch {
      setTasks((prev) => prev.map((t) => (t._id === draggableId ? { ...t, status: source.droppableId } : t)));
      toast.error('Failed to update status');
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
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save task'); }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  if (loading) return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="board-header">
        <div>
          <h1 className="page-title">Task Board</h1>
          <p className="text-secondary">{filteredTasks.length} tasks across all projects</p>
        </div>
        <button className="btn btn-primary"
          onClick={() => { setEditTask(null); setShowModal(true); }}>
          New Task
        </button>
      </div>

      <div className="board-filters">
        <select className="form-control" style={{ width: 220 }}
          value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>

        <select className="form-control" style={{ width: 160 }}
          value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {(filterProject || filterPriority) && (
          <button className="btn btn-secondary btn-sm"
            onClick={() => { setFilterProject(''); setFilterPriority(''); }}>
            Clear filters
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="dnd-board">
          {COLUMNS.map((col) => (
            <div key={col.id} className="dnd-column">
              <div className="dnd-column-header">
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <div className="col-dot" style={{ background: col.color }} />
                  <span className="col-label">{col.label}</span>
                </div>
                <span className="kanban-count">{tasksByStatus(col.id).length}</span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`dnd-tasks ${snapshot.isDraggingOver ? 'drag-over' : ''}`}>
                    {tasksByStatus(col.id).length === 0 && !snapshot.isDraggingOver && (
                      <div className="kanban-empty">Drop tasks here</div>
                    )}
                    {tasksByStatus(col.id).map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            className={`dnd-task-card ${snapshot.isDragging ? 'dragging' : ''}`}>
                            <DndTaskCard task={task}
                              onEdit={(t) => { setEditTask(t); setShowModal(true); }}
                              onDelete={handleDelete}
                              canEdit={hasRole('admin','manager') || task.assignedTo?._id === user._id}
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
        <TaskModal task={editTask}
          projectId={filterProject || projects[0]?._id}
          users={users}
          onSave={handleSaveTask}
          onClose={() => { setShowModal(false); setEditTask(null); }} />
      )}
    </div>
  );
};

const DndTaskCard = ({ task, onEdit, onDelete, canEdit }) => (
  <div>
    <div className="dnd-card-header">
      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
      {canEdit && (
        <div className="task-actions">
          <button className="btn btn-icon btn-secondary btn-sm" onClick={() => onEdit(task)} title="Edit"><EditIcon /></button>
          <button className="btn btn-icon btn-danger btn-sm" onClick={() => onDelete(task._id)} title="Delete"><TrashIcon /></button>
        </div>
      )}
    </div>
    <p className="dnd-task-title">{task.title}</p>
    {task.description && <p className="dnd-task-desc text-muted">{task.description}</p>}
    <div className="dnd-task-meta">
      {task.projectId && <span className="dnd-project-tag">{task.projectId?.title}</span>}
      {task.deadline && (
        <span className="text-muted" style={{ fontSize: 11, display:'flex', alignItems:'center', gap: 3 }}>
          <CalIcon /> {format(new Date(task.deadline), 'MMM d')}
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
