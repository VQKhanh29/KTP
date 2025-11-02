# RBAC Testing Guide - Advanced Role-Based Access Control

## Overview
This guide demonstrates the advanced RBAC system with 3 roles: **Admin**, **Moderator**, and **User**.

## Roles & Permissions

| Feature | User | Moderator | Admin |
|---------|------|-----------|-------|
| View own profile | ✅ | ✅ | ✅ |
| Upload avatar | ✅ | ✅ | ✅ |
| View user list | ❌ | ✅ | ✅ |
| View statistics | ❌ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |
| Manage RBAC | ❌ | ❌ | ✅ |

## Test Accounts

Created by `npm run seed:roles`:

```
Admin:     admin@example.com / admin123
Moderator: moderator@example.com / mod123
User:      user@example.com / user123
```

## API Endpoints

### 1. Get All Users (Admin/Moderator)
```http
GET /api/admin/users
Authorization: Bearer <accessToken>
```

**Expected:**
- Admin/Moderator: 200 OK + user list
- User: 403 Forbidden

### 2. Get Statistics (Admin/Moderator)
```http
GET /api/admin/stats
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "total": 9,
    "admins": 2,
    "moderators": 2,
    "users": 5
  }
}
```

### 3. Change User Role (Admin only)
```http
PATCH /api/admin/users/:userId/role
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "role": "moderator"
}
```

**Valid roles:** `user`, `moderator`, `admin`

**Expected:**
- Admin: 200 OK
- Moderator/User: 403 Forbidden

**Constraints:**
- Cannot change own role
- Cannot change role to invalid value

### 4. Delete User (Admin only)
```http
DELETE /api/admin/users/:userId
Authorization: Bearer <accessToken>
```

**Expected:**
- Admin: 200 OK
- Moderator/User: 403 Forbidden

**Constraints:**
- Cannot delete self
- Cannot delete last admin

## Postman Testing Flow

### Import Collection
1. Import `backend/postman/KTP_RBAC_Advanced.postman_collection.json`
2. Collection variables will auto-populate tokens

### Test Sequence

**Phase 1: Admin Access**
1. Run "1. Login as Admin"
   - ✅ Should return accessToken
2. Run "2. Get All Users"
   - ✅ Should return all users (200)
3. Run "3. Get Stats"
   - ✅ Should return statistics (200)
4. Run "4. Change User Role"
   - First, get a user ID from step 2
   - Set `targetUserId` variable
   - ✅ Should succeed (200)

**Phase 2: Moderator Access**
5. Run "5. Login as Moderator"
   - ✅ Should return modToken
6. Run "6. Get Users as Moderator"
   - ✅ Should succeed (200)
7. Run "7. Change Role as Moderator"
   - ❌ Should fail with 403 (Moderator cannot change roles)

**Phase 3: User Access (Restrictions)**
8. Run "8. Login as User"
   - ✅ Should return userToken
9. Run "9. Get Users as User"
   - ❌ Should fail with 403 (User cannot view admin endpoints)

**Phase 4: Cleanup**
10. Run "10. Delete User" (as Admin)
    - ✅ Should succeed (200)

## PowerShell Testing

```powershell
$base = "http://localhost:3000"

# Login as admin
$adminLogin = @{ email = "admin@example.com"; password = "admin123" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" -Body $adminLogin
$adminToken = $adminRes.accessToken

# Get all users (Admin)
$headers = @{ Authorization = "Bearer $adminToken" }
$users = Invoke-RestMethod -Method Get -Uri "$base/api/admin/users" -Headers $headers
$users.data | Format-Table name, email, role

# Get stats
$stats = Invoke-RestMethod -Method Get -Uri "$base/api/admin/stats" -Headers $headers
$stats.data

# Change role
$userId = $users.data[0]._id
$roleBody = @{ role = "moderator" } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "$base/api/admin/users/$userId/role" -Headers $headers -ContentType "application/json" -Body $roleBody

# Login as moderator
$modLogin = @{ email = "moderator@example.com"; password = "mod123" } | ConvertTo-Json
$modRes = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" -Body $modLogin
$modToken = $modRes.accessToken

# Try to view users as moderator (should succeed)
$modHeaders = @{ Authorization = "Bearer $modToken" }
$modUsers = Invoke-RestMethod -Method Get -Uri "$base/api/admin/users" -Headers $modHeaders
Write-Host "Moderator can view users: OK"

# Try to change role as moderator (should fail with 403)
try {
  Invoke-RestMethod -Method Patch -Uri "$base/api/admin/users/$userId/role" -Headers $modHeaders -ContentType "application/json" -Body $roleBody
} catch {
  Write-Host "Moderator cannot change roles: Expected 403" -ForegroundColor Green
}

# Login as user
$userLogin = @{ email = "user@example.com"; password = "user123" } | ConvertTo-Json
$userRes = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" -Body $userLogin
$userToken = $userRes.accessToken

# Try to view users as regular user (should fail with 403)
try {
  $userHeaders = @{ Authorization = "Bearer $userToken" }
  Invoke-RestMethod -Method Get -Uri "$base/api/admin/users" -Headers $userHeaders
} catch {
  Write-Host "User cannot access admin endpoints: Expected 403" -ForegroundColor Green
}
```

## Frontend Testing

1. **Start backend and frontend:**
   ```bash
   cd backend
   npm run dev
   
   # In another terminal
   cd frontend
   npm start
   ```

2. **Login as Admin** (admin@example.com / admin123)
   - ✅ Should see "🔐 Phân quyền RBAC" button (admin only)
   - ✅ Should see "👥 Quản lý người dùng" button
   - ✅ Should see role badge "ADMIN" in header

3. **Navigate to RBAC Management**
   - ✅ Should see statistics dashboard
   - ✅ Should see user table with role dropdowns
   - ✅ Can change user roles via dropdown
   - ✅ Can delete users

4. **Logout and login as Moderator** (moderator@example.com / mod123)
   - ✅ Should see "📋 Danh sách" button
   - ❌ Should NOT see "🔐 Phân quyền RBAC" button
   - ✅ Should see role badge "MOD" in header

5. **Logout and login as User** (user@example.com / user123)
   - ❌ Should NOT see "📋 Danh sách" button
   - ❌ Should NOT see admin/moderator features
   - ✅ Should see role badge "USER" in header
   - ✅ Should only see Profile and Avatar upload

## Screenshots Needed for Submission

1. **Postman - Admin Get Users (200)**
   - Request: GET /api/admin/users with admin token
   - Response showing user list

2. **Postman - Admin Change Role (200)**
   - Request: PATCH /api/admin/users/:id/role
   - Response confirming role change

3. **Postman - Moderator Access Denied (403)**
   - Request: PATCH /api/admin/users/:id/role with moderator token
   - Response showing 403 Forbidden

4. **Frontend - Admin View**
   - RBAC management screen with statistics
   - Role dropdown and delete button visible

5. **Frontend - Moderator View**
   - User list visible
   - No RBAC management button

6. **Frontend - User View**
   - Only profile and basic features
   - No admin/moderator buttons

## Git Workflow

```bash
# Create branch
git checkout -b feature/rbac

# Add all changes
git add .

# Commit
git commit -m "Thêm phân quyền RBAC: User, Admin, Moderator với middleware checkRole"

# Push
git push origin feature/rbac
```

Then create PR from `feature/rbac` to `feature/refresh-token` or `main`.

## Troubleshooting

### 403 Forbidden
- Ensure you're logged in with correct role
- Check token is valid (not expired)
- Verify role in JWT payload matches required permission

### Cannot see RBAC features in frontend
- Check user.role in localStorage
- Logout and login again to refresh user data
- Verify backend returned correct role in login response

### Seed script fails
- Ensure MongoDB connection is active
- Check .env has correct MONGO_URI
- Run from backend/ directory

## Next Steps

- **Activity 3**: Implement more granular permissions (e.g., resource-level access)
- Add audit logging for role changes
- Implement role hierarchy (admin inherits moderator permissions)
- Add UI for creating custom roles
