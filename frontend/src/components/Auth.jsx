import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  const handleAuthSuccess = (token) => {
    if (onAuthSuccess) onAuthSuccess(token);
  };

  return (
    <div className="auth-container">
      <div className="auth-toggle">
        <button
          className={isLogin ? 'active' : ''}
          onClick={() => setIsLogin(true)}
        >
          Đăng nhập
        </button>
        <button
          className={!isLogin ? 'active' : ''}
          onClick={() => setIsLogin(false)}
        >
          Đăng ký
        </button>
      </div>
      
      {isLogin ? (
        <Login onLoginSuccess={handleAuthSuccess} />
      ) : (
        <Signup onSignupSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default Auth;