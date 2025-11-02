const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

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

// Upload avatar to Cloudinary with Sharp optimization
exports.uploadAvatar = async (req, res) => {
  try {
    console.log('[uploadAvatar] Request received');
    console.log('[uploadAvatar] req.file:', req.file ? 'exists' : 'missing');
    console.log('[uploadAvatar] req.user:', req.user ? req.user._id : 'missing');
    
    if (!req.file || !req.file.buffer) {
      console.log('[uploadAvatar] No file in request');
      return res.status(400).json({ status: 'fail', message: 'Không có file được tải lên' });
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Định dạng file không hợp lệ. Chỉ chấp nhận: JPEG, PNG, WEBP, GIF' 
      });
    }

    // Validate file size (max 5MB before processing)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Kích thước file quá lớn. Tối đa 5MB' 
      });
    }

    console.log('[uploadAvatar] Original file size:', req.file.size, 'bytes');
    console.log('[uploadAvatar] File mimetype:', req.file.mimetype);
    console.log('[uploadAvatar] Processing with Sharp...');

    // Process image with Sharp: resize to 400x400, compress, convert to webp
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 }) // Convert to WebP with 85% quality
      .toBuffer();

    console.log('[uploadAvatar] Processed size:', processedImageBuffer.length, 'bytes');
    console.log('[uploadAvatar] Size reduction:', 
      ((1 - processedImageBuffer.length / req.file.size) * 100).toFixed(2) + '%');

    // Delete old avatar from Cloudinary if exists
    if (req.user.avatar && req.user.avatar.public_id) {
      console.log('[uploadAvatar] Deleting old avatar:', req.user.avatar.public_id);
      try {
        await cloudinary.uploader.destroy(req.user.avatar.public_id);
      } catch (err) {
        console.log('[uploadAvatar] Could not delete old avatar:', err.message);
      }
    }

    console.log('[uploadAvatar] Starting Cloudinary upload...');
    let uploadResult;
    
    // Check if Cloudinary is configured
    const hasCloudinary = cloudinaryConfig.cloud_name && 
                          cloudinaryConfig.api_key && 
                          cloudinaryConfig.api_secret;

    if (hasCloudinary) {
      // Upload to Cloudinary
      await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: 'avatars',
            resource_type: 'image',
            format: 'webp'
          }, 
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
        streamifier.createReadStream(processedImageBuffer).pipe(uploadStream);
      });
    } else {
      // Fallback: save to local uploads folder
      console.log('[uploadAvatar] Cloudinary not configured, saving locally...');
      const uploadsDir = path.join(__dirname, '../uploads/avatars');
      
      // Ensure directory exists
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
      } catch (err) {
        if (err.code !== 'EEXIST') throw err;
      }

      const filename = `avatar-${req.user._id}-${Date.now()}.webp`;
      const filepath = path.join(uploadsDir, filename);
      await fs.writeFile(filepath, processedImageBuffer);

      uploadResult = {
        secure_url: `http://localhost:${process.env.PORT || 3000}/uploads/avatars/${filename}`,
        public_id: filename
      };
      console.log('[uploadAvatar] Saved locally:', uploadResult.secure_url);
    }

    console.log('[uploadAvatar] Updating user in DB...');
    // Save avatar info to user
    const user = await User.findByIdAndUpdate(req.user._id, {
      avatar: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }
    }, { new: true, select: '-password' });

    console.log('[uploadAvatar] Success! Avatar URL:', uploadResult.secure_url);
    res.json({ 
      status: 'success', 
      data: user,
      metadata: {
        originalSize: req.file.size,
        processedSize: processedImageBuffer.length,
        compression: ((1 - processedImageBuffer.length / req.file.size) * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    console.error('[uploadAvatar] Error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Lỗi khi tải ảnh lên' 
    });
  }
};