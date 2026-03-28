const express = require('express');
const { getUsers, getNotifications, markNotificationsRead, updateProfile } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsRead);
router.put('/profile', updateProfile);

module.exports = router;
