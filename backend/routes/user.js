const express = require('express');
const router = express.Router();
const { getUsers, deleteUser } = require('../controllers/userController');
const { protect } = require('../controllers/authController');
const { restrictTo } = require('../middleware/rbac');

// All routes require authentication
router.use(protect);

// Authenticated users can list users (admins will see roles). Keep delete rules in controller.
router.get('/', getUsers);

// Delete route - admin can delete any user, users can delete themselves
router.delete('/:id', deleteUser);

module.exports = router;
