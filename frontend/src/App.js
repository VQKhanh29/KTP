import React, { useState, useEffect } from "react";
import axios from "axios";
import AddUser from "./components/AddUser";
import UserList from "./components/UserList";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import UserManagement from "./components/UserManagement";
import RoleManagement from "./components/RoleManagement";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import UploadAvatar from "./components/UploadAvatar";
import "./styles/Auth.css";

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [currentView, setCurrentView] = useState('users'); // 'users', 'profile', 'admin', 'roles', 'forgot', 'reset', 'avatar'

  // Configure axios defaults when token changes
  useEffect(() => {
    // Set Authorization header when access token is present
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }

    // Add a response interceptor to handle 401 -> refresh
    const interceptor = axios.interceptors.response.use(
      (resp) => resp,
      async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            // No refresh token, propagate
            return Promise.reject(error);
          }
          try {
            const res = await axios.post('http://localhost:3000/api/auth/refresh', { refreshToken });
            const { accessToken: newAccessToken } = res.data;
            if (newAccessToken) {
              localStorage.setItem('accessToken', newAccessToken);
              axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
              setToken(newAccessToken);
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshErr) {
            // Refresh failed -> logout
            console.error('Refresh failed', refreshErr);
            handleLogout();
            return Promise.reject(refreshErr);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
  const res = await axios.get("http://localhost:3000/users");
  // backend may return array directly or under `data` key
  setUsers(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        handleLogout();
      } else {
        setError("Không thể tải danh sách người dùng từ server.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch users for the users view (all authenticated users) or when admin opens admin view
    if (!token) return;

    if (currentView === 'users') {
      fetchUsers();
      return;
    }

    if (user?.role === 'admin' && currentView === 'admin') {
      fetchUsers();
    }
  }, [token, currentView, user]);

  const handleAuthSuccess = () => {
    const a = localStorage.getItem('accessToken');
    setToken(a);
    setUser(JSON.parse(localStorage.getItem('user')));
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;

    try {
      setLoading(true);
      await axios.delete(`http://localhost:3000/users/${id}`);
      // remove from local state
      setUsers(prev => prev.filter(u => (u._id || u.id) !== id));
    } catch (err) {
      console.error('Failed to delete user', err);
      setError(err.response?.data?.message || 'Không thể xóa người dùng');
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userToEdit) => {
    // Simple edit placeholder — could open a modal to edit later
    alert(`Sửa người dùng: ${userToEdit.name} (${userToEdit.email}) — chức năng chưa triển khai.`);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // Try revoking on server
        await axios.post('http://localhost:3000/api/auth/logout', { refreshToken }).catch(() => {});
      }
    } catch {}

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setUsers([]);
  };

  if (!token) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div>
          {user && user.role === 'admin' && (
            <>
              <button 
                onClick={() => setCurrentView('roles')}
                style={{ 
                  marginRight: '1rem',
                  backgroundColor: currentView === 'roles' ? '#dc3545' : '#fff',
                  color: currentView === 'roles' ? '#fff' : '#dc3545',
                  border: '1px solid #dc3545',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                🔐 Phân quyền RBAC
              </button>
              <button 
                onClick={() => setCurrentView('admin')}
                style={{ 
                  marginRight: '1rem',
                  backgroundColor: currentView === 'admin' ? '#007bff' : '#fff',
                  color: currentView === 'admin' ? '#fff' : '#007bff',
                  border: '1px solid #007bff',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                👥 Quản lý người dùng
              </button>
            </>
          )}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <button 
              onClick={() => setCurrentView('users')}
              style={{ 
                marginRight: '1rem',
                backgroundColor: currentView === 'users' ? '#28a745' : '#fff',
                color: currentView === 'users' ? '#fff' : '#28a745',
                border: '1px solid #28a745',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📋 Danh sách
            </button>
          )}
          <button 
            onClick={() => setCurrentView('profile')}
            style={{ 
              marginRight: '1rem',
              backgroundColor: currentView === 'profile' ? '#007bff' : '#fff',
              color: currentView === 'profile' ? '#fff' : '#007bff',
              border: '1px solid #007bff',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            👤 Thông tin cá nhân
          </button>
          <button 
            onClick={() => setCurrentView('avatar')}
            style={{ 
              marginRight: '1rem',
              backgroundColor: currentView === 'avatar' ? '#17a2b8' : '#fff',
              color: currentView === 'avatar' ? '#fff' : '#17a2b8',
              border: '1px solid #17a2b8',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📷 Tải avatar
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: '600' }}>
                {user.name}
              </span>
              <span style={{ 
                padding: '4px 8px', 
                borderRadius: '12px', 
                backgroundColor: user.role === 'admin' ? '#dc3545' : user.role === 'moderator' ? '#ffc107' : '#28a745',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {user.role === 'admin' ? 'ADMIN' : user.role === 'moderator' ? 'MOD' : 'USER'}
              </span>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            style={{ 
              padding: '0.5rem 1rem', 
              cursor: 'pointer',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Đăng xuất
          </button>
        </div>
      </nav>

      {currentView === 'roles' && user?.role === 'admin' ? (
        <RoleManagement token={token} />
      ) : currentView === 'admin' && user?.role === 'admin' ? (
        <UserManagement token={token} currentUser={user} fetchUsers={fetchUsers} users={users} />
      ) : currentView === 'users' && (user?.role === 'admin' || user?.role === 'moderator') ? (
        <>
          {user?.role === 'admin' && <AddUser fetchUsers={fetchUsers} />}
          <UserList users={users} loading={loading} error={error} onDelete={handleDeleteUser} onEdit={handleEditUser} />
        </>
      ) : currentView === 'forgot' ? (
        <ForgotPassword />
      ) : currentView === 'reset' ? (
        <ResetPassword />
      ) : currentView === 'avatar' ? (
        <UploadAvatar 
          token={token} 
          onUploaded={(updatedUser) => {
            // Persist to localStorage and state so greeting/avatar reflect immediately
            try {
              const newUser = { ...(user || {}), ...updatedUser };
              localStorage.setItem('user', JSON.stringify(newUser));
              setUser(newUser);
            } catch {}
          }}
        />
      ) : currentView === 'profile' ? (
        <Profile token={token} onLogout={handleLogout} />
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Chào mừng, {user?.name}!</h2>
          <p>Role của bạn: <strong>{user?.role}</strong></p>
          <p>Chọn một chức năng từ menu phía trên.</p>
        </div>
      )}
    </div>
  );
}

export default App;
