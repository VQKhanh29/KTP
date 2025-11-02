import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RoleManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Xác nhận thay đổi role thành ${newRole}?`)) return;

    try {
      setLoading(true);
      setMessage('');
      setError('');
      await axios.patch(
        `http://localhost:3000/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Đã cập nhật role thành công');
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thay đổi role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Xác nhận xóa người dùng này?')) return;

    try {
      setLoading(true);
      setMessage('');
      setError('');
      await axios.delete(`http://localhost:3000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Đã xóa người dùng thành công');
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa người dùng');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'moderator': return '#ffc107';
      case 'user': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'moderator': return 'Kiểm duyệt viên';
      case 'user': return 'Người dùng';
      default: return role;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔐 Quản lý phân quyền (RBAC)</h2>

      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#6c757d' }}>Tổng số</h4>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{stats.total}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #dc3545' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#dc3545' }}>Admins</h4>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold', color: '#dc3545' }}>{stats.admins}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#fffbf0', borderRadius: '8px', border: '1px solid #ffc107' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>Moderators</h4>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold', color: '#856404' }}>{stats.moderators}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f0fff4', borderRadius: '8px', border: '1px solid #28a745' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>Users</h4>
            <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold', color: '#155724' }}>{stats.users}</p>
          </div>
        </div>
      )}

      {message && <div style={{ padding: '1rem', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Tên</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Role hiện tại</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Thay đổi role</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>{u.name}</td>
                <td style={{ padding: '12px' }}>{u.email}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '12px', 
                    backgroundColor: getRoleBadgeColor(u.role), 
                    color: '#fff', 
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    {getRoleLabel(u.role)}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <select
                    value={u.role}
                    onChange={(e) => handleChangeRole(u._id, e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ced4da' }}
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDeleteUser(u._id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RoleManagement;
