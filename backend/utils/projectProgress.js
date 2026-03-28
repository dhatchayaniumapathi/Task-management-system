const Task = require('../models/Task.model');
const Project = require('../models/Project.model');

/**
 * Recalculates and saves project progress based on completed tasks.
 * @param {string} projectId - MongoDB project _id
 */
const updateProjectProgress = async (projectId) => {
  const tasks = await Task.find({ projectId });
  if (tasks.length === 0) {
    await Project.findByIdAndUpdate(projectId, { progress: 0 });
    return;
  }
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const progress = Math.round((completed / tasks.length) * 100);
  await Project.findByIdAndUpdate(projectId, { progress });
};

module.exports = { updateProjectProgress };
