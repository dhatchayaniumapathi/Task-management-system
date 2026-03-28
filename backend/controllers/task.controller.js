const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const Notification = require('../models/Notification.model');
const { updateProjectProgress } = require('../utils/projectProgress');

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, status, deadline } = req.body;

    // Verify the project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isMember = project.members.some((m) => m.toString() === req.user._id.toString());
    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to add tasks to this project' });
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || 'medium',
      status: status || 'todo',
      deadline,
      statusHistory: [{ status: status || 'todo', changedBy: req.user._id }],
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // Update parent project progress
    await updateProjectProgress(projectId);

    // Create a notification if task is assigned to someone
    if (assignedTo && assignedTo !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'task_assigned',
        message: `${req.user.name} assigned you a task: "${title}"`,
        relatedProject: projectId,
        relatedTask: task._id,
      });

      // Emit notification to the assigned user's socket room
      req.io.to(assignedTo.toString()).emit('notification', notification);
    }

    // Emit task creation to all members of the project room
    req.io.to(projectId.toString()).emit('taskCreated', task);

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get tasks - filtered by project, assignee, status, or priority
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res) => {
  try {
    const { projectId, assignedTo, status, priority } = req.query;

    // Build dynamic filter object
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Non-admin users only see tasks in their projects
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      filter.projectId = filter.projectId || { $in: projectIds };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update a task (status, priority, assignment, etc.)
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Track status change in history
    if (req.body.status && req.body.status !== task.status) {
      task.statusHistory.push({ status: req.body.status, changedBy: req.user._id });
    }

    // Apply updates
    Object.assign(task, req.body);
    await task.save();

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('projectId', 'title');

    // Update project progress whenever a task changes
    await updateProjectProgress(task.projectId._id || task.projectId);

    // Notify assignee on reassignment
    if (req.body.assignedTo && req.body.assignedTo !== req.user._id.toString()) {
      await Notification.create({
        recipient: req.body.assignedTo,
        sender: req.user._id,
        type: 'task_assigned',
        message: `${req.user.name} assigned you a task: "${task.title}"`,
        relatedProject: task.projectId,
        relatedTask: task._id,
      });
      req.io.to(req.body.assignedTo).emit('notification', { message: `New task assigned: ${task.title}` });
    }

    // Emit update to the project room
    req.io.to(task.projectId.toString()).emit('taskUpdated', task);

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const projectId = task.projectId;
    await task.deleteOne();
    await updateProjectProgress(projectId);

    req.io.to(projectId.toString()).emit('taskDeleted', { taskId: req.params.id });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
