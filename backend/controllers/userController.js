const User = require("../models/User");

// GET /users - Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.json({
      status: 'success',
      results: users.length,
      data: users
    });
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({
      status: 'error',
      message: 'Không thể tải danh sách người dùng'
    });
  }
};

// DELETE /users/:id - Delete user (admin only or self-delete)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy người dùng'
      });
    }

    // Allow admins to delete any user, but regular users can only delete themselves
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền xóa người dùng khác'
      });
    }

    // Prevent deleting the last admin
    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Không thể xóa admin cuối cùng'
        });
      }
    }

    await User.findByIdAndDelete(id);

    res.json({
      status: 'success',
      message: 'Xóa người dùng thành công'
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({
      status: 'error',
      message: 'Không thể xóa người dùng'
    });
  }
};

module.exports = {
  getUsers,
  deleteUser,
};
