// controllers/userController.js
console.log('DEBUG: loading controllers/userController.js, initial module.exports ->', module.exports);

// Mảng tạm lưu trữ danh sách người dùng
let users = [
  { id: 1, name: "Vo Quoc Khanh", email: "khanh222281@student.nctu.edu.vn" },
  { id: 2, name: "Nguyen Tan Phat", email: "phat@student.nctu.edu.vn" }
];

// [GET] /users - Lấy danh sách người dùng
const getUsers = (req, res) => {
  res.status(200).json(users);
};

// [POST] /users - Thêm người dùng mới
const createUser = (req, res) => {
  // Guard against missing body (avoid crash when req.body is undefined)
  const { name, email } = req.body || {};

  // Kiểm tra dữ liệu
  if (!name || !email) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ name và email" });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email
  };

  users.push(newUser);
  res.status(201).json(newUser);
};

// Xuất module
module.exports = { getUsers, createUser };
console.log('DEBUG: controllers/userController.js set module.exports ->', module.exports);
