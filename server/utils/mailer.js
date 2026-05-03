// 文件位置: server/utils/mailer.js
const nodemailer = require('nodemailer');

// 配置发送者的邮箱信息
const transporter = nodemailer.createTransport({
  service: 'qq', // 如果你用网易邮箱，这里写 '163'
  auth: {
    user: '3536945931@qq.com', // 替换为你的真实邮箱
    pass: 'kxjrtbymquklchbc'       // 替换为你在邮箱设置里获取的授权码（绝对不是QQ密码！）
  }
});

const sendVerifyCode = async (toEmail, code) => {
  await transporter.sendMail({
    from: '"Form-A-Team 组队平台" <3536945931@qq.com>', // 必须和上面的 user 一致
    to: toEmail,
    subject: '组队平台 - 您的登录/注册验证码',
    html: `
      <div style="padding: 20px; background-color: #f8fafc; border-radius: 10px;">
        <h3 style="color: #1e293b;">欢迎来到 Form-A-Team！</h3>
        <p>您的验证码是：<strong style="color: #004e9e; font-size: 24px; letter-spacing: 2px;">${code}</strong></p>
        <p style="color: #64748b; font-size: 13px;">请在 5 分钟内完成验证。如果这不是您本人的操作，请忽略此邮件。</p>
      </div>
    `
  });
};

module.exports = { sendVerifyCode };