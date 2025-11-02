const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const API_BASE = 'http://localhost:3000';

async function http(pathSuffix, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${pathSuffix}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { data = text; }
  return { status: res.status, data };
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  try {
    // 1) Sign up a user who will become admin
    const adminEmail = `smoke_admin_${Date.now()}@example.com`;
    const signupRes = await http('/api/auth/signup', 'POST', {
      name: 'Smoke Admin',
      email: adminEmail,
      password: 'password123'
    });
    console.log('Signup admin response:', signupRes.status, signupRes.data);
    if (signupRes.status >= 400) throw new Error('Signup failed');

    const adminUser = signupRes.data.user;
    const adminToken = signupRes.data.token;

    // 2) Promote the user to admin directly in DB
    const User = require('../models/User');
    await User.findByIdAndUpdate(adminUser._id, { role: 'admin' });
    console.log('Promoted user to admin:', adminUser._id);

    // 3) Call GET /users as admin
    const usersRes = await http('/users', 'GET', null, adminToken);
    console.log('GET /users response (admin):', usersRes.status);
    console.dir(usersRes.data, { depth: 3 });

    // 4) Create another user to be deleted
    const userEmail = `smoke_user_${Date.now()}@example.com`;
    const signupUserRes = await http('/api/auth/signup', 'POST', {
      name: 'Smoke User',
      email: userEmail,
      password: 'password123'
    });
    console.log('Signup normal user response:', signupUserRes.status, signupUserRes.data);
    const normalUser = signupUserRes.data.user;

    // 5) Delete the normal user as admin
    const deleteRes = await http(`/users/${normalUser._id}`, 'DELETE', null, adminToken);
    console.log('DELETE /users/:id response:', deleteRes.status, deleteRes.data);

  } catch (err) {
    console.error('Error during smoke test:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected DB.');
  }
}

run();
