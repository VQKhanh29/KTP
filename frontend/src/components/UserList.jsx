import React from "react";

function UserList({ 
  users = [], 
  loading = false, 
  error = null, 
  onEdit,      // 👈 thêm callback khi nhấn nút Sửa
  onDelete     // 👈 thêm callback khi nhấn nút Xóa
}) {
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
            <li key={u._id || u.id}>
              <strong>{u.name}</strong> — {u.email}{" "}
              {/* 🧩 Thêm 2 nút hành động */}
              <button onClick={() => onEdit && onEdit(u)}>Sửa</button>{" "}
              <button 
                onClick={() => onDelete && onDelete(u._id || u.id)} 
                style={{ color: "red" }}
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserList;
