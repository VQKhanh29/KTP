import React, { useState } from "react";
import axios from "axios";

function AddUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:3000/users", { name, email })
      .then(() => {
        alert("✅ Thêm người dùng thành công!");
        setName("");
        setEmail("");
      })
      .catch(err => {
        alert("❌ Lỗi thêm người dùng!");
        console.error(err);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Thêm người dùng</h2>
      <input
        type="text"
        placeholder="Tên người dùng"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button type="submit">Thêm</button>
    </form>
  );
}

export default AddUser;
