import React, { useState } from 'react';
import axios from 'axios';

function UploadAvatar({ token, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage('Vui lòng chọn file');
    setLoading(true);
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      // Don't manually set Content-Type - browser will set it with boundary
  const res = await axios.post('http://localhost:3000/api/profile/avatar', fd, { headers });
      setMessage('Tải ảnh thành công');
      // Show returned avatar url if present
  if (res.data?.data?.avatar?.url) setPreview(res.data.data.avatar.url);
  if (onUploaded && res.data?.data) onUploaded(res.data.data);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Lỗi khi tải ảnh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Tải avatar</h2>
      <form onSubmit={handleUpload}>
        <input type="file" accept="image/*" onChange={onFileChange} />
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
            {loading ? 'Đang tải...' : 'Tải lên'}
          </button>
        </div>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
      {preview && (
        <div style={{ marginTop: 12 }}>
          <img src={preview} alt="avatar preview" style={{ maxWidth: 200, borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

export default UploadAvatar;
