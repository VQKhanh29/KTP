# Hoạt động 2 - Advanced RBAC (Role-Based Access Control)

## ✅ Hoàn thành

### Backend Implementation

#### 1. User Schema Update (SV3)
**File:** `backend/models/User.js`
- Cập nhật enum role: `['user', 'admin', 'moderator']`
- Default role: `'user'`

#### 2. Middleware checkRole (SV1)
**File:** `backend/middleware/rbac.js`
- Export `checkRole` (alias của `restrictTo`)
- Kiểm tra user có role phù hợp không
- Trả về 403 nếu không đủ quyền

#### 3. Admin API Endpoints (SV1)
**File:** `backend/routes/admin.js`

| Endpoint | Method | Role | Chức năng |
|----------|--------|------|-----------|
| `/api/admin/users` | GET | Admin, Moderator | Xem tất cả users |
| `/api/admin/stats` | GET | Admin, Moderator | Thống kê role |
| `/api/admin/users/:id/role` | PATCH | Admin only | Đổi role user |
| `/api/admin/users/:id` | DELETE | Admin only | Xóa user |

**Constraints:**
- Không thể đổi role chính mình
- Không thể xóa chính mình
- Không thể xóa admin cuối cùng

#### 4. Seed Data (SV3)
**File:** `backend/scripts/seed_roles.js`
- Script tạo dữ liệu mẫu
- Tài khoản test:
  - Admin: `admin@example.com` / `admin123`
  - Moderator: `moderator@example.com` / `mod123`
  - User: `user@example.com` / `user123`

**Chạy:** `npm run seed:roles`

### Frontend Implementation (SV2)

#### 1. Role Management Component
**File:** `frontend/src/components/RoleManagement.jsx`
- Dashboard thống kê (Admin, Moderator, User count)
- Bảng danh sách users
- Dropdown thay đổi role
- Nút xóa user

#### 2. App.js Updates
**File:** `frontend/src/App.js`
- Navigation hiển thị theo role:
  - **Admin**: Phân quyền RBAC, Quản lý người dùng, Danh sách, Profile, Avatar
  - **Moderator**: Danh sách, Profile, Avatar
  - **User**: Profile, Avatar only
- Role badge trong header (màu khác nhau theo role)
- View routing theo quyền

### Testing & Documentation

#### 1. Postman Collection
**File:** `backend/postman/KTP_RBAC_Advanced.postman_collection.json`
- 10 requests test đầy đủ flow
- Auto-capture tokens
- Test cả success và forbidden cases

#### 2. Documentation
**File:** `backend/docs/RBAC_TESTING.md`
- Hướng dẫn test API đầy đủ
- PowerShell scripts
- Frontend testing guide
- Screenshots checklist

## 📸 Sản phẩm nộp

### 1. Ảnh Postman - API kiểm tra quyền

**Test cases cần chụp:**

a) **Admin Get Users (200 OK)**
```
GET /api/admin/users
Authorization: Bearer <admin-token>
→ Response: 200 + danh sách users
```

b) **Admin Change Role (200 OK)**
```
PATCH /api/admin/users/:id/role
Body: { "role": "moderator" }
→ Response: 200 + user updated
```

c) **Moderator Change Role (403 Forbidden)**
```
PATCH /api/admin/users/:id/role
Authorization: Bearer <moderator-token>
→ Response: 403 "Bạn không có quyền thực hiện hành động này"
```

d) **User Access Admin API (403 Forbidden)**
```
GET /api/admin/users
Authorization: Bearer <user-token>
→ Response: 403
```

### 2. Demo Frontend theo role

**Admin view:**
- Screenshot menu có: 🔐 Phân quyền RBAC, 👥 Quản lý người dùng
- Screenshot RBAC dashboard với statistics
- Screenshot role change dropdown
- Header hiển thị badge "ADMIN" (màu đỏ)

**Moderator view:**
- Screenshot menu có: 📋 Danh sách (KHÔNG có Phân quyền)
- Screenshot user list (read-only)
- Header hiển thị badge "MOD" (màu vàng)

**User view:**
- Screenshot menu chỉ có: 👤 Profile, 📷 Avatar
- Header hiển thị badge "USER" (màu xanh)

### 3. Link PR GitHub

Branch: `feature/rbac`

**URL tạo PR:**
```
https://github.com/VQKhanh29/KTP/pull/new/feature/rbac
```

**Commit message:**
```
Thêm phân quyền RBAC: User, Admin, Moderator với middleware checkRole và frontend role-based UI
```

**Files changed:**
- Backend: 6 files (models, middleware, routes, scripts, docs)
- Frontend: 2 files (App.js, RoleManagement.jsx)
- Postman: 1 collection
- Total: 13 files, 1258+ insertions

## 🧪 Quick Test Commands

### 1. Seed database
```bash
cd backend
npm run seed:roles
```

### 2. Start servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 3. Import Postman
- Import `backend/postman/KTP_RBAC_Advanced.postman_collection.json`
- Run requests 1-10 in order

### 4. PowerShell Quick Test
```powershell
$base = "http://localhost:3000"

# Login admin
$admin = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

# Get stats
$headers = @{ Authorization = "Bearer $($admin.accessToken)" }
Invoke-RestMethod -Method Get -Uri "$base/api/admin/stats" -Headers $headers
```

## 📋 Features Summary

| Feature | Implemented | Tested |
|---------|-------------|--------|
| 3 roles (User, Admin, Mod) | ✅ | ✅ |
| checkRole middleware | ✅ | ✅ |
| Admin APIs | ✅ | ✅ |
| Seed script | ✅ | ✅ |
| Frontend role-based UI | ✅ | ✅ |
| Postman collection | ✅ | ✅ |
| Documentation | ✅ | ✅ |
| Git branch & PR | ✅ | ✅ |

## 🔗 Links

- **GitHub PR:** https://github.com/VQKhanh29/KTP/pull/new/feature/rbac
- **Branch:** `feature/rbac`
- **Testing Guide:** `backend/docs/RBAC_TESTING.md`
- **Postman Collection:** `backend/postman/KTP_RBAC_Advanced.postman_collection.json`

---

**Date:** November 2, 2025  
**Status:** ✅ Ready for submission
