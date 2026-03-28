const Project = require('../models/Project.model');
const Task = require('../models/Task.model');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Admin, Manager)
 */
const createProject = async (req, res) => {
  try {
    const { title, description, members, deadline } = req.body;

    const project = await Project.create({
      title,
      description,
      owner: req.user._id,
      members: members || [],
      deadline,
    });

    // Populate owner and members for the response
    await project.populate('owner', 'name email role');
    await project.populate('members', 'name email role');

    // Emit real-time event to all clients
    req.io.emit('projectCreated', project);

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all projects (Admin sees all; others see only their projects)
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res) => {
  try {
    let query;

    if (req.user.role === 'admin') {
      query = Project.find();
    } else {
      // Members only see projects they are part of
      query = Project.find({ members: req.user._id });
    }

    const projects = await query
      .populate('owner', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    // Attach task count to each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ projectId: project._id });
        const completedCount = await Task.countDocuments({ projectId: project._id, status: 'completed' });
        return {
          ...project.toObject(),
          taskCount,
          completedCount,
        };
      })
    );

    res.json({ success: true, count: projects.length, data: projectsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single project by ID with its tasks
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check access: admin sees all; others must be a member
    const isMember = project.members.some((m) => m._id.toString() === req.user._id.toString());
    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
    }

    // Fetch tasks grouped by status
    const tasks = await Task.find({ projectId: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { ...project.toObject(), tasks } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private (Admin, Manager who owns the project)
 */
const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Only admin or project owner can update
    const isOwner = project.owner.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    req.io.emit('projectUpdated', project);

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a project and all its tasks
 * @route   DELETE /api/projects/:id
 * @access  Private (Admin only)
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    // Cascade delete all tasks belonging to this project
    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();

    req.io.emit('projectDeleted', { projectId: req.params.id });

    res.json({ success: true, message: 'Project and its tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject };
