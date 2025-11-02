// Simple smoke test for refresh token flow
// 1) signup a random user (or fallback to login if exists)
// 2) call /auth/refresh to obtain a new access token

const axios = require('axios');

const API = 'http://localhost:3000/api/auth';

async function main() {
  const email = `student_${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Student Test';
  let accessToken, refreshToken;

  try {
    console.log('Signing up test user:', email);
    const { data } = await axios.post(`${API}/signup`, { name, email, password });
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    console.log('Signup OK');
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('User exists, logging in...');
      const { data } = await axios.post(`${API}/login`, { email, password });
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
    } else {
      throw err;
    }
  }

  console.log('Access token:', accessToken ? 'present' : 'missing');
  console.log('Refresh token:', refreshToken ? 'present' : 'missing');

  // Call refresh
  const { data: r2 } = await axios.post(`${API}/refresh`, { refreshToken });
  console.log('Refreshed access token present:', !!r2.accessToken);

  console.log('Calling logout (revoke refresh token)');
  await axios.post(`${API}/logout`, { refreshToken });
  console.log('Logout OK');
}

main().catch((e) => {
  console.error('Smoke test failed:', e.response?.data || e.message);
  process.exit(1);
});
