import React, { useState } from 'react';
import axios from 'axios';
import './UploadAvatar.css';

function UploadAvatar({ token, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [metadata, setMetadata] = useState(null);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    setError('');
    setMessage('');
    setMetadata(null);

    if (!f) {
      setFile(null);
      setPreview('');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(f.type)) {
      setError('Định dạng file không hợp lệ. Chỉ chấp nhận: JPEG, PNG, WEBP, GIF');
      setFile(null);
      setPreview('');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (f.size > maxSize) {
      setError('Kích thước file quá lớn. Tối đa 5MB');
      setFile(null);
      setPreview('');
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Vui lòng chọn file');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');
    setUploadProgress(0);

    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.post('http://localhost:3000/api/profile/avatar', fd, { 
        headers,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setMessage('✅ Tải ảnh thành công!');
      if (res.data?.metadata) {
        setMetadata(res.data.metadata);
      }
      
      // Show returned avatar url
      if (res.data?.data?.avatar?.url) {
        setPreview(res.data.data.avatar.url);
      }
      
      if (onUploaded && res.data?.data) {
        onUploaded(res.data.data);
      }

      // Clear file input
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Lỗi khi tải ảnh');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="upload-avatar-container">
      <h2>📷 Tải ảnh đại diện</h2>
      <p className="upload-hint">Kích thước tối đa: 5MB. Định dạng: JPEG, PNG, WEBP, GIF</p>
      
      <form onSubmit={handleUpload} className="upload-form">
        <div className="file-input-wrapper">
          <input 
            type="file" 
            accept="image/*" 
            onChange={onFileChange}
            id="avatar-input"
            className="file-input"
          />
          <label htmlFor="avatar-input" className="file-label">
            {file ? file.name : 'Chọn ảnh'}
          </label>
        </div>

        {file && (
          <div className="file-info">
            <p>📁 Kích thước: {formatBytes(file.size)}</p>
            <p>🖼️ Định dạng: {file.type}</p>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || !file}
          className="upload-button"
        >
          {loading ? `Đang tải... ${uploadProgress}%` : '⬆️ Tải lên'}
        </button>
      </form>

      {loading && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">❌ {error}</div>}

      {metadata && (
        <div className="metadata-info">
          <h4>📊 Thông tin xử lý:</h4>
          <p>Kích thước gốc: {formatBytes(metadata.originalSize)}</p>
          <p>Kích thước sau xử lý: {formatBytes(metadata.processedSize)}</p>
          <p>Tỷ lệ nén: {metadata.compression}</p>
          <p className="optimization-note">✨ Ảnh đã được tối ưu (400x400px, WebP format)</p>
        </div>
      )}

      {preview && (
        <div className="preview-container">
          <h4>Xem trước:</h4>
          <img src={preview} alt="avatar preview" className="preview-image" />
        </div>
      )}
    </div>
  );
}

export default UploadAvatar;
