import React, { useState } from 'react';
import axios from 'axios';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setMessage('Vui lòng nhập email');
    setLoading(true);
    setMessage('');
    setResetToken('');
    try {
      const res = await axios.post('http://localhost:3000/api/auth/forgot-password', { email });
      setMessage(res.data.message || 'Nếu email tồn tại, token đã được gửi');
      // Dev: backend may return resetToken for testing
      if (res.data.resetToken) setResetToken(res.data.resetToken);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Quên mật khẩu</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Nhập email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
          {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
      </form>

      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
      {resetToken && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Reset token (DEV):</strong>
          <pre style={{ background: '#f5f5f5', padding: '0.5rem' }}>{resetToken}</pre>
        </div>
      )}
    </div>
  );
}

export default ForgotPassword;
