const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure cloudinary from env - ensure we have the values
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
};

console.log('[Cloudinary Config Check]', {
  cloud_name: cloudinaryConfig.cloud_name ? 'set' : 'missing',
  api_key: cloudinaryConfig.api_key ? 'set' : 'missing',
  api_secret: cloudinaryConfig.api_secret ? 'set' : 'missing'
});

cloudinary.config(cloudinaryConfig);

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'email'];
    const updates = {};

    // Only allow updating specific fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // If updating email, check if new email already exists
    if (updates.email) {
      const existingUser = await User.findOne({ 
        email: updates.email,
        _id: { $ne: req.user._id } // exclude current user
      });
      
      if (existingUser) {
        return res.status(400).json({
          status: 'fail',
          message: 'Email đã được sử dụng'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { 
        new: true, // return updated user
        runValidators: true, // run model validations
        select: '-password' // exclude password from response
      }
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Upload avatar to Cloudinary
exports.uploadAvatar = async (req, res) => {
  try {
    console.log('[uploadAvatar] Request received');
    console.log('[uploadAvatar] req.file:', req.file ? 'exists' : 'missing');
    console.log('[uploadAvatar] req.user:', req.user ? req.user._id : 'missing');
    
    if (!req.file || !req.file.buffer) {
      console.log('[uploadAvatar] No file in request');
      return res.status(400).json({ status: 'fail', message: 'Không có file được tải lên' });
    }

    console.log('[uploadAvatar] File size:', req.file.size, 'bytes');
    console.log('[uploadAvatar] File mimetype:', req.file.mimetype);
    console.log('[uploadAvatar] Starting Cloudinary upload...');

    let uploadResult;
    await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'avatars' }, 
        (error, result) => {
          if (error) {
            console.error('[uploadAvatar] Cloudinary error:', error);
            return reject(error);
          }
          console.log('[uploadAvatar] Cloudinary success:', result.secure_url);
          uploadResult = result;
          resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    console.log('[uploadAvatar] Updating user in DB...');
    // Save avatar info to user
    const user = await User.findByIdAndUpdate(req.user._id, {
      avatar: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }
    }, { new: true, select: '-password' });

    console.log('[uploadAvatar] Success! Avatar URL:', uploadResult.secure_url);
    res.json({ status: 'success', data: user });
  } catch (error) {
    console.error('[uploadAvatar] Error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Lỗi khi tải ảnh lên' 
    });
  }
};