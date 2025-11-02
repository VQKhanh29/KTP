const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Vui lòng đăng nhập'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    next();
  };
};

// Alias for better naming
const checkRole = restrictTo;

module.exports = {
  restrictTo,
  checkRole
};