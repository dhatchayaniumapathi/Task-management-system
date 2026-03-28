const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/project.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

const projectRules = [
  body('title').trim().notEmpty().withMessage('Project title is required'),
];

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(authorize('admin', 'manager'), projectRules, validate, createProject);

router
  .route('/:id')
  .get(getProjectById)
  .put(authorize('admin', 'manager'), updateProject)
  .delete(authorize('admin', 'manager'), deleteProject);

module.exports = router;
