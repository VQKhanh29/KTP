# Hướng dẫn cấu hình Gmail SMTP cho Email Reset Password

## 🎯 Mục tiêu
Cấu hình Gmail để gửi email reset password thông qua SMTP

## 📋 Yêu cầu
- Tài khoản Gmail
- Xác thực 2 yếu tố (2-Step Verification) đã bật

## 🔧 Các bước cấu hình

### Bước 1: Bật xác thực 2 yếu tố (2FA)

1. Truy cập [Google Account Security](https://myaccount.google.com/security)
2. Tìm mục **"Signing in to Google"** (Đăng nhập vào Google)
3. Click vào **"2-Step Verification"** (Xác minh 2 bước)
4. Làm theo hướng dẫn để bật 2FA (nếu chưa bật)

### Bước 2: Tạo App Password

1. Sau khi bật 2FA, quay lại trang [Security](https://myaccount.google.com/security)
2. Tìm mục **"2-Step Verification"** và click vào
3. Kéo xuống tìm **"App passwords"** (Mật khẩu ứng dụng)
4. Click vào **"App passwords"**
5. Chọn app: **"Mail"**
6. Chọn device: **"Other (Custom name)"** → Nhập tên: **"KTP Backend"**
7. Click **"Generate"**
8. Google sẽ hiển thị mật khẩu 16 ký tự (ví dụ: `abcd efgh ijkl mnop`)
9. **Lưu ý:** Sao chép mật khẩu này ngay lập tức (bỏ qua dấu cách)

### Bước 3: Cập nhật file `.env`

Mở file `backend/.env` và cập nhật:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=your-actual-gmail@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Lưu ý:**
- `EMAIL_USER`: Email Gmail của bạn (ví dụ: `myemail@gmail.com`)
- `EMAIL_PASS`: App password 16 ký tự (KHÔNG phải mật khẩu Gmail thường)
- Bỏ dấu cách trong app password (chỉ giữ 16 ký tự liền nhau)

### Bước 4: Khởi động lại backend server

```bash
cd backend
npm run dev
```

## ✅ Kiểm tra cấu hình

### Test 1: Gửi yêu cầu forgot password

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Kiểm tra console backend, bạn sẽ thấy:
```
✅ Password reset email sent: <message-id>
```

### Test 2: Kiểm tra email

1. Đăng nhập vào email đã test
2. Kiểm tra hộp thư đến (Inbox) hoặc thư rác (Spam/Junk)
3. Bạn sẽ nhận được email với tiêu đề: **"Password Reset Request - KTP"**
4. Email có nút **"Reset Password"** và link reset

## 🚨 Xử lý lỗi thường gặp

### Lỗi 1: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Nguyên nhân:**
- Sử dụng mật khẩu Gmail thường thay vì App Password
- App Password chưa được tạo
- 2FA chưa được bật

**Giải pháp:**
1. Đảm bảo đã bật 2FA
2. Tạo lại App Password
3. Copy đúng 16 ký tự (không có dấu cách)

### Lỗi 2: "Connection timeout"

**Nguyên nhân:**
- Firewall chặn port 587
- Network không ổn định

**Giải pháp:**
1. Kiểm tra kết nối mạng
2. Thử đổi port từ 587 sang 465:
   ```javascript
   // backend/utils/email.js
   const transporter = nodemailer.createTransport({
     host: 'smtp.gmail.com',
     port: 465, // Thay vì 587
     secure: true, // Thêm dòng này
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS
     }
   });
   ```

### Lỗi 3: Email vào Spam

**Nguyên nhân:**
- Gmail chưa tin tưởng ứng dụng của bạn

**Giải pháp:**
1. Đánh dấu email từ ứng dụng là "Not spam"
2. Thêm email vào danh sách liên hệ
3. Trong production, cần cấu hình SPF, DKIM, DMARC records

### Lỗi 4: "Less secure app access"

**Nguyên nhân:**
- Google đã ngừng hỗ trợ "Less secure apps" từ 30/5/2022
- Phải dùng App Password

**Giải pháp:**
- Không thể tắt "Less secure apps" nữa
- Bắt buộc phải dùng App Password với 2FA

## 📧 Email Template Preview

Email reset password sẽ có giao diện:
- Header gradient màu tím (brand color)
- Thông tin email và thời gian hết hạn
- Nút "Reset Password" lớn, dễ click
- Link dự phòng để copy/paste
- Cảnh báo bảo mật
- Footer với thông tin công ty

## 🔒 Bảo mật

**Quan trọng:**
1. **KHÔNG** commit file `.env` lên Git
2. **KHÔNG** share App Password với ai
3. **XÓA** App Password khi không dùng nữa
4. Sử dụng biến môi trường khác nhau cho dev/staging/production
5. Trong production, cân nhắc dùng dịch vụ email chuyên nghiệp (SendGrid, AWS SES, Mailgun)

## 📝 Notes

- Token reset password có hiệu lực 10 phút
- Token chỉ dùng được 1 lần
- Mỗi lần request forgot password sẽ tạo token mới (token cũ bị vô hiệu)
- Frontend tự động extract token từ URL query params
- Sau khi reset thành công, user được auto-login với token mới

## 🎨 Tùy chỉnh Email Template

Để thay đổi giao diện email, sửa file `backend/utils/email.js`:

```javascript
const mailOptions = {
  // ... 
  html: `
    <!-- Tùy chỉnh HTML template tại đây -->
  `
};
```

Các biến có sẵn:
- `${email}`: Email người nhận
- `${resetUrl}`: Link reset password
- `${resetToken}`: Token reset (nếu cần)
- `${new Date().getFullYear()}`: Năm hiện tại

## 📚 Tham khảo

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Google App Passwords](https://support.google.com/accounts/answer/185833)
