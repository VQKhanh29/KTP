// routes/user.js
const express = require('express');
const router = express.Router();
// Diagnostic: confirm this file is loaded and what it exports will be
console.log('DEBUG: loading routes/user.js, initial module.exports ->', module.exports);
const { getUsers, createUser } = require('../controllers/userController');

// Định nghĩa các route
router.get('/', getUsers);     // GET /users
router.post('/', createUser);  // POST /users

module.exports = router;
console.log('DEBUG: routes/user.js set module.exports ->', module.exports);
