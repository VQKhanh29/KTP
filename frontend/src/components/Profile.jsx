import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

function Profile({ token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setProfile(response.data.data);
        setFormData({
          name: response.data.data.name,
          email: response.data.data.email
        });
      } catch (err) {
        if (err.response?.status === 401) {
          onLogout();
        } else {
          setError('Không thể tải thông tin cá nhân');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [onLogout, token, refreshKey]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.put('http://localhost:3000/api/profile', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProfile(response.data.data);
      setSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
      } else {
        setError(err.response?.data?.message || 'Không thể cập nhật thông tin');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="profile-container">Đang tải...</div>;

  return (
    <div className="profile-container">
      <h2>Thông tin cá nhân</h2>
      {profile?.avatar?.url && (
        <div style={{ marginBottom: '1rem' }}>
          <img 
            src={profile.avatar.url} 
            alt="avatar" 
            style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
          />
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {!isEditing ? (
        <div className="profile-info">
          <div className="info-group">
            <label>Tên:</label>
            <span>{profile?.name}</span>
          </div>
          <div className="info-group">
            <label>Email:</label>
            <span>{profile?.email}</span>
          </div>
            <button 
            onClick={() => setIsEditing(true)}
            className="edit-button"
          >
            Chỉnh sửa
          </button>
            <button 
              type="button"
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="edit-button"
              style={{ marginLeft: 8 }}
            >
              Tải lại ảnh
            </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Tên:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: profile.name,
                  email: profile.email
                });
                setError('');
              }}
              className="cancel-button"
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;