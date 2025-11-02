const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authController = require('../controllers/authController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Protect all profile routes
router.use(authController.protect);

router.route('/')
  .get(profileController.getProfile)
  .put(profileController.updateProfile);

// Upload avatar
router.post('/avatar', upload.single('avatar'), profileController.uploadAvatar);

module.exports = router;