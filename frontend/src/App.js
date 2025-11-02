import React, { useState, useEffect } from "react";
import axios from "axios";
import AddUser from "./components/AddUser";
import UserList from "./components/UserList";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import UserManagement from "./components/UserManagement";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import UploadAvatar from "./components/UploadAvatar";
import "./styles/Auth.css";

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [currentView, setCurrentView] = useState('users'); // 'users', 'profile', 'admin', 'forgot', 'reset', 'avatar'

  // Configure axios defaults when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
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

  const handleAuthSuccess = (newToken) => {
    setToken(newToken);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
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
          <button 
            onClick={() => setCurrentView('forgot')}
            style={{ 
              marginRight: '1rem',
              backgroundColor: currentView === 'forgot' ? '#28a745' : '#fff',
              color: currentView === 'forgot' ? '#fff' : '#28a745',
              border: '1px solid #28a745',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Quên mật khẩu
          </button>
          <button 
            onClick={() => setCurrentView('reset')}
            style={{ 
              marginRight: '1rem',
              backgroundColor: currentView === 'reset' ? '#ffc107' : '#fff',
              color: currentView === 'reset' ? '#000' : '#ffc107',
              border: '1px solid #ffc107',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Đổi mật khẩu
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
            Tải avatar
          </button>
          {user && user.role === 'admin' && (
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
              Quản lý người dùng
            </button>
          )}
          <button 
            onClick={() => setCurrentView('profile')}
            style={{ 
              backgroundColor: currentView === 'profile' ? '#007bff' : '#fff',
              color: currentView === 'profile' ? '#fff' : '#007bff',
              border: '1px solid #007bff',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Thông tin cá nhân
          </button>
        </div>
        <div>
          {user && <span style={{ marginRight: '1rem' }}>Xin chào, {user.name}!</span>}
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

      {currentView === 'admin' && user?.role === 'admin' ? (
        <UserManagement token={token} currentUser={user} fetchUsers={fetchUsers} users={users} />
      ) : currentView === 'users' ? (
        <>
          <AddUser fetchUsers={fetchUsers} />
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
      ) : (
        <Profile token={token} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
