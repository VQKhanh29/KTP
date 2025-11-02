# Testing Guide - Forgot Password & Email

## 📋 Tổng quan

Tài liệu này hướng dẫn test đầy đủ tính năng Forgot Password & Reset Password với email thật qua Gmail SMTP.

## 🎯 Checklist

### Backend Testing
- [x] Nodemailer installed và cấu hình
- [ ] Gmail SMTP credentials configured trong `.env`
- [ ] Backend server running
- [ ] Database connected
- [ ] User test accounts seeded

### Email Configuration
- [ ] Gmail 2-Step Verification enabled
- [ ] Gmail App Password created
- [ ] App Password added to `.env` file
- [ ] Test email sent successfully

### Frontend Testing
- [ ] ForgotPassword component renders correctly
- [ ] ResetPassword component renders correctly
- [ ] Token auto-extracted from URL
- [ ] Password strength indicator works
- [ ] Form validations work
- [ ] Success/error messages display

### Integration Testing
- [ ] Full flow: Request → Email → Reset → Login
- [ ] Token expiration (10 minutes)
- [ ] Invalid token handling
- [ ] Multiple reset requests

## 🚀 Chuẩn bị

### 1. Cấu hình Gmail SMTP

**Đọc chi tiết:** [GMAIL_SMTP_SETUP.md](./GMAIL_SMTP_SETUP.md)

**Tóm tắt:**
```bash
# 1. Bật 2-Step Verification trên Gmail
# 2. Tạo App Password: https://myaccount.google.com/apppasswords
# 3. Copy App Password (16 ký tự)
# 4. Cập nhật backend/.env
```

File `.env`:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=abcdefghijklmnop
FRONTEND_URL=http://localhost:3001
```

### 2. Khởi động Backend

```bash
cd backend
npm install
npm run dev
```

Kiểm tra console:
```
✅ Server running on port 3000
✅ MongoDB connected
```

### 3. Khởi động Frontend

```bash
cd frontend
npm install
npm start
```

Frontend sẽ chạy trên `http://localhost:3001`

### 4. Seed test accounts (nếu chưa có)

```bash
cd backend
node scripts/seed_roles.js
```

Accounts created:
- `user@example.com` / `user123`
- `moderator@example.com` / `mod123`
- `admin@example.com` / `admin123`

## 📧 Test Case 1: Forgot Password Flow

### Bước 1: Request reset token

**Postman:**
```
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Expected Response (200):**
```json
{
  "status": "success",
  "message": "Link reset mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư rác)."
}
```

**Backend Console:**
```
[ForgotPassword] Sending reset email to: user@example.com
[ForgotPassword] Reset URL: http://localhost:3001/reset-password?token=abc123...
✅ Password reset email sent: <1234567890.abcd@gmail.com>
```

### Bước 2: Kiểm tra email

1. Đăng nhập vào `user@example.com`
2. Kiểm tra Inbox (hoặc Spam/Junk)
3. Email có tiêu đề: **"Password Reset Request - KTP"**
4. Nội dung email:
   - Header gradient tím đẹp
   - Thông tin email và thời gian hết hạn (10 phút)
   - Nút "Reset Password" lớn
   - Link dự phòng để copy/paste
   - Cảnh báo bảo mật

### Bước 3: Click vào link reset

**Link format:**
```
http://localhost:3001/reset-password?token=abc123def456...
```

**Expected:**
- Browser mở trang reset password
- Token tự động được extract vào form
- Form hiển thị 2 ô nhập mật khẩu
- Password strength indicator
- Show/hide password buttons

### Bước 4: Đặt mật khẩu mới

1. Nhập mật khẩu mới: `newpassword123`
2. Xác nhận mật khẩu: `newpassword123`
3. Click "Đổi mật khẩu"

**Expected Response (200):**
```json
{
  "status": "success",
  "message": "Mật khẩu đã được cập nhật thành công",
  "accessToken": "eyJhbGc...",
  "refreshToken": "abc123...",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "Test User",
    "role": "user"
  }
}
```

**Expected UI:**
- Success message hiển thị màu xanh
- Thông báo "Đang chuyển đến trang đăng nhập..."
- Auto redirect sau 2 giây
- Auto login với tokens mới

### Bước 5: Verify login với password mới

**Postman:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "newpassword123"
}
```

**Expected (200):**
```json
{
  "status": "success",
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

## 🧪 Test Case 2: Edge Cases

### 2.1. Email không tồn tại

**Request:**
```
POST /api/auth/forgot-password
{
  "email": "nonexistent@example.com"
}
```

**Expected (200):**
```json
{
  "status": "success",
  "message": "Nếu email tồn tại trong hệ thống, link reset mật khẩu đã được gửi đến email của bạn."
}
```

**Lý do:**
- Không tiết lộ email có tồn tại hay không (security)
- Trả về success nhưng không gửi email thật

### 2.2. Token không hợp lệ

**Request:**
```
POST /api/auth/reset-password/invalidtoken123
{
  "password": "newpassword123"
}
```

**Expected (400):**
```json
{
  "status": "fail",
  "message": "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu reset mật khẩu lại."
}
```

### 2.3. Token đã hết hạn (>10 phút)

**Test:**
1. Request forgot password
2. Đợi 10 phút
3. Thử dùng token

**Expected (400):**
```json
{
  "status": "fail",
  "message": "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu reset mật khẩu lại."
}
```

### 2.4. Password quá ngắn (<6 ký tự)

**Request:**
```
POST /api/auth/reset-password/validtoken
{
  "password": "123"
}
```

**Expected (400):**
```json
{
  "status": "fail",
  "message": "Mật khẩu phải có ít nhất 6 ký tự"
}
```

### 2.5. Multiple reset requests

**Test:**
1. Request forgot password lần 1 → Token A
2. Request forgot password lần 2 → Token B
3. Thử dùng Token A → Fail (vì đã bị thay bằng Token B)
4. Thử dùng Token B → Success

**Expected:**
- Mỗi request tạo token mới
- Token cũ bị vô hiệu hóa

## 🎨 Frontend Testing

### ForgotPassword Component

**URL:** `http://localhost:3001/forgot-password`

**Test Cases:**

1. **Initial render:**
   - Form hiển thị đẹp
   - Icon 🔐
   - Placeholder: "example@gmail.com"
   - Button: "Gửi link reset mật khẩu"

2. **Email validation:**
   - Empty email → Error: "Vui lòng nhập địa chỉ email"
   - Invalid format → Error: "Email không hợp lệ"
   - Valid email → Success

3. **Success state:**
   - Icon ✅
   - Message: "Email đã được gửi!"
   - Info box với hướng dẫn
   - Button "Gửi lại email"

4. **Loading state:**
   - Button disabled
   - Spinner animation
   - Text: "Đang gửi..."

### ResetPassword Component

**URL:** `http://localhost:3001/reset-password?token=abc123...`

**Test Cases:**

1. **Token auto-extract:**
   - Token từ URL tự động fill vào state
   - Console log: "Token extracted from URL: abc123..."

2. **Password strength indicator:**
   - <6 chars → Red "Yếu" (33%)
   - 6-9 chars → Yellow "Trung bình" (66%)
   - ≥10 chars → Green "Mạnh" (100%)

3. **Password visibility toggle:**
   - Click 👁️ → Show password
   - Click 👁️‍🗨️ → Hide password

4. **Password match validation:**
   - Not match → ❌ "Mật khẩu không khớp"
   - Match → ✅ "Mật khẩu khớp"

5. **Success:**
   - Green message
   - "Đang chuyển đến trang đăng nhập..."
   - Auto redirect sau 2s
   - Tokens saved to localStorage
   - Auto login

## 📊 Postman Collection

**Import:** `backend/postman/KTP_Forgot_Password_Email.postman_collection.json`

**10 Test Requests:**
1. ✅ Forgot Password - Valid Email
2. ✅ Forgot Password - Non-existent Email
3. ✅ Forgot Password - Missing Email
4. ✅ Reset Password - Valid Token
5. ✅ Reset Password - Invalid Token
6. ✅ Reset Password - Expired Token
7. ✅ Reset Password - Missing Password
8. ✅ Reset Password - Weak Password
9. ✅ Login with New Password
10. ✅ Multiple Reset Requests

**Run all tests:**
```bash
newman run backend/postman/KTP_Forgot_Password_Email.postman_collection.json
```

## 🐛 Troubleshooting

### Email không được gửi

**Triệu chứng:**
```
❌ Error sending password reset email: Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Giải pháp:**
1. Kiểm tra `EMAIL_USER` và `EMAIL_PASS` trong `.env`
2. Đảm bảo dùng App Password (16 ký tự), KHÔNG phải mật khẩu Gmail thường
3. Xem chi tiết: [GMAIL_SMTP_SETUP.md](./GMAIL_SMTP_SETUP.md)

### Email vào Spam

**Giải pháp:**
1. Đánh dấu "Not spam"
2. Thêm email vào Contacts
3. Trong production: Cấu hình SPF, DKIM, DMARC

### Token không extract được từ URL

**Kiểm tra:**
1. URL có dạng: `?token=abc123...` (không phải `/token`)
2. Console log có hiện: "Token extracted from URL"
3. Refresh page

### Frontend không redirect sau reset

**Kiểm tra:**
1. Response có `accessToken` và `refreshToken`
2. localStorage được set
3. Console không có error
4. Timeout 2000ms đã đủ

## ✅ Success Criteria

### Backend
- [x] Email gửi thành công (console log message ID)
- [x] Token hashed trước khi lưu database
- [x] Token expires sau 10 phút
- [x] Password được hash trước khi lưu
- [x] Trả về access + refresh tokens sau reset

### Frontend
- [x] Form validation hoạt động
- [x] Token auto-extract từ URL
- [x] Password strength indicator
- [x] Show/hide password
- [x] Success message và auto redirect
- [x] Responsive design

### Email
- [x] Email template đẹp (gradient, responsive)
- [x] Link reset hoạt động
- [x] Thông tin đầy đủ (email, expiry, security notes)
- [x] Plain text fallback

### Security
- [x] Token chỉ dùng được 1 lần
- [x] Token hết hạn sau 10 phút
- [x] Token được hash trong database
- [x] Không tiết lộ email có tồn tại hay không
- [x] Password được hash với bcrypt
- [x] Auto login sau reset thành công

## 📸 Screenshots

Capture screenshots của:
1. Email nhận được trong Gmail
2. ForgotPassword page (form + success state)
3. ResetPassword page (form + validation)
4. Success message và auto redirect
5. Login thành công với password mới

## 🎓 Learning Points

1. **Nodemailer:** Cấu hình SMTP transporter, HTML email templates
2. **Gmail SMTP:** App Passwords, 2FA, ports 587/465
3. **Security:** Token hashing, expiration, single-use
4. **UX:** Auto token extract, password strength, auto redirect
5. **Email Design:** Responsive HTML, inline CSS, fallback text

## 📝 Notes

- Token có hiệu lực 10 phút (configurable)
- Email template có thể customize trong `backend/utils/email.js`
- Frontend tự động lưu tokens và login sau reset
- Production nên dùng service chuyên nghiệp (SendGrid, AWS SES)
