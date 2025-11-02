const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { checkRole } = require('../middleware/rbac');
const User = require('../models/User');

// All admin routes require authentication
router.use(authController.protect);

// Get all users (Admin and Moderator can view)
router.get('/users', checkRole('admin', 'moderator'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      status: 'success',
      results: users.length,
      data: users
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách người dùng'
    });
  }
});

// Change user role (Admin only)
router.patch('/users/:id/role', checkRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Role không hợp lệ. Chỉ chấp nhận: user, admin, moderator'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng'
      });
    }

    // Prevent changing own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Không thể thay đổi role của chính mình'
      });
    }

    user.role = role;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      status: 'success',
      message: `Đã cập nhật role thành ${role}`,
      data: userResponse
    });
  } catch (err) {
    console.error('Change role error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi thay đổi role'
    });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', checkRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Không thể xóa tài khoản của chính mình'
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Không thể xóa admin cuối cùng'
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Đã xóa người dùng thành công'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi xóa người dùng'
    });
  }
});

// Get statistics (Admin and Moderator)
router.get('/stats', checkRole('admin', 'moderator'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const moderatorCount = await User.countDocuments({ role: 'moderator' });
    const userCount = await User.countDocuments({ role: 'user' });

    res.json({
      status: 'success',
      data: {
        total: totalUsers,
        admins: adminCount,
        moderators: moderatorCount,
        users: userCount
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy thống kê'
    });
  }
});

module.exports = router;
