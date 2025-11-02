import React, { useState } from "react";
import axios from "axios";

function AddUser({ fetchUsers }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Kiểm tra dữ liệu
    if (!name.trim()) {
      alert("⚠️ Name không được để trống");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      alert("⚠️ Email không hợp lệ");
      return;
    }

    try {
      // Use the auth signup endpoint to create a user
      await axios.post("http://localhost:3000/api/auth/signup", { name, email, password: 'password123' });
      alert("✅ Thêm user thành công!");
      setName("");
      setEmail("");
      fetchUsers(); // cập nhật lại danh sách
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi thêm user!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Thêm người dùng mới</h3>
      <input
        type="text"
        placeholder="Nhập tên"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Nhập email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Thêm</button>
    </form>
  );
}

export default AddUser;
