const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');

// Sign access token (short lived)
const signAccessToken = (userId) => {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES || '15m';
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};

// Create refresh token (random string) and persist
const createRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const days = parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10);
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const rt = await RefreshToken.create({ user: userId, token, expires });
  return rt;
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

    // Generate tokens
    const accessToken = signAccessToken(user._id);
    const refreshTokenDoc = await createRefreshToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      accessToken,
      refreshToken: refreshTokenDoc.token,
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

    const accessToken = signAccessToken(user._id);
    const refreshTokenDoc = await createRefreshToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      status: 'success',
      accessToken,
      refreshToken: refreshTokenDoc.token,
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
        return res.status(401).json({ status: 'error', message: 'Người dùng không tồn tại' });
      }

      // Add user to request
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ status: 'error', message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi xác thực'
    });
  }
};

// Forgot password - generate reset token and send via email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Vui lòng cung cấp email' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security: don't reveal whether email exists
      return res.json({ 
        status: 'success', 
        message: 'Nếu email tồn tại trong hệ thống, link reset mật khẩu đã được gửi đến email của bạn.' 
      });
    }

    // Create reset token (plain text, will be sent in email)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before storing in database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes for security
    await user.save({ validateBeforeSave: false });

    // Construct frontend reset URL (user will click this from their email)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    console.log('[ForgotPassword] Sending reset email to:', email);
    console.log('[ForgotPassword] Reset URL:', resetUrl);

    try {
      // Send email with reset link
      await sendPasswordResetEmail({
        email: user.email,
        resetToken,
        resetUrl
      });

      res.json({ 
        status: 'success', 
        message: 'Link reset mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư rác).' 
      });
    } catch (emailError) {
      // If email fails, rollback the reset token
      console.error('[ForgotPassword] Email send failed:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ 
        status: 'error', 
        message: 'Có lỗi khi gửi email. Vui lòng kiểm tra cấu hình email và thử lại sau.' 
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Có lỗi khi xử lý yêu cầu' 
    });
  }
};

// Reset password using token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Token không hợp lệ' 
      });
    }
    
    if (!password) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Vui lòng cung cấp mật khẩu mới' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu reset mật khẩu lại.' 
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('[ResetPassword] Password reset successful for:', user.email);

    // Log the user in by generating new tokens
    const accessToken = signAccessToken(user._id);
    const refreshTokenDoc = await createRefreshToken(user._id);

    const userResp = user.toObject(); 
    delete userResp.password;

    res.json({ 
      status: 'success', 
      message: 'Mật khẩu đã được cập nhật thành công',
      accessToken,
      refreshToken: refreshTokenDoc.token,
      user: userResp 
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Có lỗi khi reset mật khẩu' 
    });
  }
};

// Refresh access token using refresh token
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ status: 'fail', message: 'Refresh token required' });

    const stored = await RefreshToken.findOne({ token: refreshToken }).populate('user');
    if (!stored || stored.revoked) return res.status(401).json({ status: 'fail', message: 'Refresh token invalid' });
    if (stored.expires < Date.now()) return res.status(401).json({ status: 'fail', message: 'Refresh token expired' });

    // Issue new access token
    const accessToken = signAccessToken(stored.user._id);

    res.json({ status: 'success', accessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi khi làm mới token' });
  }
};

// Logout (revoke refresh token)
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ status: 'fail', message: 'Refresh token required' });

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (stored) {
      stored.revoked = true;
      await stored.save();
    }

    // Also remove client-side tokens by instructing client
    res.json({ status: 'success', message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi khi đăng xuất' });
  }
};