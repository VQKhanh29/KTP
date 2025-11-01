// routes/user.js
const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');

// Diagnostic (tùy chọn, có thể giữ để debug)
console.log('DEBUG: loading routes/user.js, initial module.exports ->', module.exports);

// Định nghĩa các route CRUD cho User
router.get('/', getUsers);            // GET /users
router.post('/', createUser);         // POST /users
router.put('/:id', updateUser);       // PUT /users/:id
router.delete('/:id', deleteUser);    // DELETE /users/:id

module.exports = router;

console.log('DEBUG: routes/user.js set module.exports ->', module.exports);
