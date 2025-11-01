import React from "react";

function UserList({ users = [], loading = false, error = null }) {
  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Danh sách người dùng</h2>
      {(!users || users.length === 0) ? (
        <p>Chưa có người dùng nào.</p>
      ) : (
        <ul>
          {users.map(u => (
            <li key={u._id || u.id}><strong>{u.name}</strong> — {u.email}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserList;
