import React, { useState, useEffect } from "react";
import axios from "axios";
import UserList from "./components/UserList";
import AddUser from "./components/AddUser";

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get("http://localhost:3000/users")
      .then((res) => setUsers(res.data || []))
      .catch((err) => {
        console.error("Failed to fetch users:", err);
        setError("Không thể tải danh sách người dùng từ server.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async ({ name, email }) => {
    setError(null);
    try {
      const res = await axios.post("http://localhost:3000/users", { name, email });
      const created = res && res.data ? res.data : { _id: Date.now().toString(), name, email };
      setUsers((prev) => [...prev, created]);
    } catch (err) {
      console.error("POST /users failed, falling back to local add:", err);
      const local = { _id: `local-${Date.now()}`, name, email };
      setUsers((prev) => [...prev, local]);
      setError("Không thể kết nối backend — thêm tạm thời trên client.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Quản lý User</h1>
  <AddUser onAdd={handleAdd} />
      <hr />
      <UserList users={users} loading={loading} error={error} />
    </div>
  );
}

export default App;
