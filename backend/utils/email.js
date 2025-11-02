const nodemailer = require('nodemailer');

/**
 * Create email transporter using Gmail SMTP
 * Requires environment variables: EMAIL_USER and EMAIL_PASS
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.resetToken - Password reset token
 * @param {string} options.resetUrl - Full reset URL
 */
const sendPasswordResetEmail = async ({ email, resetToken, resetUrl }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"KTP Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - KTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #667eea;
            margin-top: 0;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning {
            color: #dc3545;
            font-size: 14px;
            margin-top: 20px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
          }
          .token-display {
            background: #e9ecef;
            padding: 12px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            word-break: break-all;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <h2>Hello!</h2>
            <p>We received a request to reset your password for your KTP account.</p>
            
            <div class="info-box">
              <strong>📧 Email:</strong> ${email}<br>
              <strong>⏰ Valid for:</strong> 10 minutes
            </div>

            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <p style="font-size: 14px; color: #6c757d;">
              Or copy and paste this link into your browser:
            </p>
            <div class="token-display">
              ${resetUrl}
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 10 minutes</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged</li>
                <li>Consider changing your password if you suspect unauthorized access</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>
              This is an automated email from KTP.<br>
              Please do not reply to this email.
            </p>
            <p style="margin-top: 10px;">
              &copy; ${new Date().getFullYear()} KTP. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    // Plain text fallback
    text: `
Password Reset Request

We received a request to reset your password for your KTP account.

Email: ${email}
Valid for: 10 minutes

To reset your password, click the link below or copy and paste it into your browser:
${resetUrl}

Security Notice:
- This link will expire in 10 minutes
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged

This is an automated email from KTP. Please do not reply.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send welcome email to new users
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.name - User's name
 */
const sendWelcomeEmail = async ({ email, name }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"KTP Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to KTP! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .content {
            padding: 40px 30px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to KTP!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name}!</h2>
            <p>Thank you for joining KTP. We're excited to have you on board!</p>
            <p>Your account has been successfully created and you can now start using all features.</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The KTP Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} KTP. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to KTP!

Hi ${name}!

Thank you for joining KTP. We're excited to have you on board!

Your account has been successfully created and you can now start using all features.

If you have any questions, feel free to reach out to our support team.

Best regards,
The KTP Team
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};
