const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );
};

// Sign Up
exports.signup = async (req, res) => {
  try {
    console.log('[authController.signup] body:', req.body);
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email đã được sử dụng'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password // Password will be hashed by the pre-save hook
    });

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Có lỗi xảy ra khi đăng ký'
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    console.log('[authController.login] body:', req.body);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      status: 'success',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Có lỗi xảy ra khi đăng nhập'
    });
  }
};

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  try {
    // Get token from header
    let token = req.header('Authorization');

    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Không có quyền truy cập'
      });
    }

    // Remove Bearer from string
    token = token.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Người dùng không tồn tại'
        });
      }

      // Add user to request
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi xác thực'
    });
  }
};

// Forgot password - generate reset token and "send" it
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security don't reveal whether email exists
      return res.json({ status: 'success', message: 'If that email exists, a reset token has been sent.' });
    }

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // In production, you'd send the resetToken via email. For development we'll log it and return a safe message.
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    console.log('[ForgotPassword] resetUrl:', resetUrl);

    // Return success but include token in response for testing (DEV only)
    const resp = { status: 'success', message: 'Reset token created' };
    if (process.env.NODE_ENV !== 'production') resp.resetToken = resetToken;

    res.json(resp);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ status: 'error', message: 'Có lỗi khi xử lý yêu cầu' });
  }
};

// Reset password using token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!token) return res.status(400).json({ status: 'fail', message: 'Token không hợp lệ' });
    if (!password) return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp mật khẩu mới' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) return res.status(400).json({ status: 'fail', message: 'Token không hợp lệ hoặc đã hết hạn' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Optionally, log the user in by sending token
    const newToken = generateToken(user._id);
    const userResp = user.toObject(); delete userResp.password;
    res.json({ status: 'success', token: newToken, user: userResp });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ status: 'error', message: 'Có lỗi khi reset mật khẩu' });
  }
};