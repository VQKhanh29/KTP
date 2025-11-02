# Avatar Upload Testing Guide - Advanced Upload with Sharp + Cloudinary

## Overview
Advanced avatar upload system with:
- ✅ **Sharp** image processing: resize to 400x400, WebP conversion, compression
- ✅ **Cloudinary** cloud storage with automatic fallback to local storage
- ✅ **Multer** multipart file handling with JWT authentication
- ✅ File validation: type, size, format
- ✅ Progressive upload with real-time preview

## Features

### Backend Processing
1. **Image Validation**
   - Allowed formats: JPEG, PNG, WEBP, GIF
   - Max size: 5MB

2. **Sharp Processing**
   - Resize: 400x400 pixels (cover, center crop)
   - Format: Convert to WebP
   - Quality: 85%
   - Typical compression: 60-80% size reduction

3. **Storage**
   - **Cloudinary** (if configured): Upload to `avatars/` folder
   - **Local fallback**: Save to `backend/uploads/avatars/`
   - Old avatar deletion on new upload

4. **Response Metadata**
   ```json
   {
     "status": "success",
     "data": { "avatar": { "url": "...", "public_id": "..." } },
     "metadata": {
       "originalSize": 245678,
       "processedSize": 48932,
       "compression": "80.10%"
     }
   }
   ```

### Frontend Features
- Drag-and-drop file input
- Client-side validation
- Upload progress bar
- Real-time preview
- Compression stats display
- Responsive design

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install sharp
```

### 2. Cloudinary Configuration

Create account at [cloudinary.com](https://cloudinary.com) and add to `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Note:** If Cloudinary is not configured, the system automatically falls back to local storage.

### 3. Start Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

## API Testing

### Endpoint
```
POST /api/profile/avatar
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

### Request
```
FormData:
  avatar: <file>
```

### Responses

**Success (200)**
```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "name": "User Name",
    "email": "user@example.com",
    "avatar": {
      "url": "https://res.cloudinary.com/.../avatar.webp",
      "public_id": "avatars/xyz123"
    }
  },
  "metadata": {
    "originalSize": 1234567,
    "processedSize": 234567,
    "compression": "81.00%"
  }
}
```

**Error (400) - Invalid Format**
```json
{
  "status": "fail",
  "message": "Định dạng file không hợp lệ. Chỉ chấp nhận: JPEG, PNG, WEBP, GIF"
}
```

**Error (400) - File Too Large**
```json
{
  "status": "fail",
  "message": "Kích thước file quá lớn. Tối đa 5MB"
}
```

**Error (401) - Unauthorized**
```json
{
  "status": "error",
  "message": "Không có quyền truy cập"
}
```

## Postman Testing

### Import Collection
Import `backend/postman/KTP_Avatar_Upload.postman_collection.json`

### Test Flow

1. **Login** → Get access token
2. **Get Profile (Before)** → See current avatar (if any)
3. **Upload Avatar** 
   - Select a test image (JPEG/PNG)
   - Should return 200 + avatar URL + compression stats
4. **Get Profile (After)** → Verify avatar URL is updated
5. **Upload Invalid Format** → Try PDF/TXT → Should fail with 400
6. **Upload Without Auth** → No token → Should fail with 401
7. **Upload Second Avatar** → Should replace old avatar

### Screenshots for Submission

**Required:**
1. Postman request #3: Upload Avatar (Success)
   - Show form-data with image file
   - Response with avatar URL and metadata
2. Postman request #5: Invalid format rejection (400)
3. Frontend upload UI with preview
4. Frontend showing compression statistics

## PowerShell Testing

```powershell
$base = "http://localhost:3000"

# Login
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'
$token = $login.accessToken

# Upload avatar
$imagePath = "C:\path\to\your\test-image.jpg"
$headers = @{ Authorization = "Bearer $token" }

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$fileBin = [System.IO.File]::ReadAllBytes($imagePath)
$enc = [System.Text.Encoding]::GetEncoding("iso-8859-1")

$body = (
  "--$boundary",
  'Content-Disposition: form-data; name="avatar"; filename="test.jpg"',
  'Content-Type: image/jpeg',
  '',
  $enc.GetString($fileBin),
  "--$boundary--"
) -join "`r`n"

$response = Invoke-RestMethod -Method Post -Uri "$base/api/profile/avatar" `
  -Headers $headers `
  -ContentType "multipart/form-data; boundary=$boundary" `
  -Body $body

Write-Host "Avatar uploaded!" -ForegroundColor Green
$response.data.avatar | Format-List
$response.metadata | Format-List
```

## Frontend Testing

1. **Login** to the app
2. **Navigate** to "📷 Tải avatar"
3. **Select Image**
   - Choose a JPEG/PNG file
   - Preview should appear immediately
   - File info displayed (size, format)
4. **Upload**
   - Click "⬆️ Tải lên"
   - Progress bar animates
   - Success message + compression stats appear
5. **Verify**
   - Go to "👤 Thông tin cá nhân"
   - Avatar should display at top
6. **Replace**
   - Upload another image
   - Old avatar should be replaced

### Testing Invalid Files

- **PDF/TXT**: Should show error "Định dạng file không hợp lệ"
- **Large file (>5MB)**: Should show "Kích thước file quá lớn"
- **No file selected**: Button disabled

## Cloudinary Verification

### Via Dashboard
1. Login to [cloudinary.com](https://cloudinary.com)
2. Go to Media Library
3. Check `avatars/` folder
4. Verify uploaded images are WebP format, 400x400px

### Via URL
- Cloudinary URLs look like: `https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/avatars/abc123.webp`
- Should be accessible publicly

## Local Fallback Testing

If you want to test local storage fallback:

1. Temporarily remove Cloudinary credentials from `.env`
2. Restart backend
3. Upload avatar
4. Check `backend/uploads/avatars/` folder
5. URL will be: `http://localhost:3000/uploads/avatars/avatar-<userId>-<timestamp>.webp`

## Performance Metrics

| Metric | Before Sharp | After Sharp |
|--------|-------------|-------------|
| File Size (JPG 2MB) | 2,048 KB | ~400 KB (80% reduction) |
| Dimensions | Variable | 400x400 (fixed) |
| Format | JPEG/PNG | WebP |
| Upload Time | ~3s | ~2s |

## Troubleshooting

### Sharp Installation Issues
```bash
# Windows
npm install --platform=win32 --arch=x64 sharp

# If still fails, rebuild
npm rebuild sharp
```

### Cloudinary Upload Fails
- Check `.env` has correct credentials
- Verify network connection
- Check Cloudinary dashboard for quota limits
- System will fallback to local storage automatically

### Avatar Not Displaying
- Check CORS settings in `server.js`
- Verify URL is accessible
- Check browser console for errors
- Ensure `/uploads` route is mounted

### Large Files Fail
- Max size is 5MB
- Reduce image size before upload
- Or adjust `maxSize` in `profileController.js`

## Git Workflow

```bash
git checkout -b feature/avatar-upload
git add .
git commit -m "Thêm upload avatar với Sharp + Cloudinary: resize 400x400, WebP, validation"
git push origin feature/avatar-upload
```

## Submission Checklist

- [ ] Postman screenshot: Upload avatar success with metadata
- [ ] Postman screenshot: Invalid format rejection
- [ ] Frontend screenshot: Upload UI with preview
- [ ] Frontend screenshot: Profile showing avatar
- [ ] Cloudinary dashboard screenshot (optional)
- [ ] PR link on GitHub
- [ ] Demo video (optional): Upload → Process → Display

## Next Steps

- Add image cropping UI (frontend)
- Support multiple file upload
- Add avatar history/gallery
- Implement CDN caching
- Add image filters/effects
