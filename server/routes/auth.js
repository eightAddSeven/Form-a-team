const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
// ✅ 引入发信工具
const { sendVerifyCode } = require('../utils/mailer') 

const router = express.Router()

// 简单存一下验证码（生产环境一般用 Redis，这里用内存对象代替）
const codeStore = {};

// ==========================================
// 1. 发送验证码接口 (新增)
// ==========================================
router.post('/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: '邮箱不能为空' });

  // 生成 6 位纯数字验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await sendVerifyCode(email, code);
    // 存入内存，设置 5 分钟过期
    codeStore[email] = { code, expire: Date.now() + 5 * 60 * 1000 };
    console.log(`[发信成功] 给 ${email} 发送了验证码: ${code}`);
    res.json({ message: '验证码已发送，请查收' });
  } catch (error) {
    console.error('发信失败:', error);
    res.status(500).json({ message: '验证码发送失败，请检查服务器邮箱配置' });
  }
});

// ==========================================
// 2. 邮箱验证码快捷登录/自动注册 (新增)
// ==========================================
router.post('/email-login', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: '邮箱和验证码不能为空' });

    // 校验验证码
    const record = codeStore[email];
    if (!record || record.code !== code) {
      return res.status(400).json({ message: '验证码错误' });
    }
    if (Date.now() > record.expire) {
      return res.status(400).json({ message: '验证码已过期，请重新获取' });
    }

    // 验证通过，马上销毁验证码防止重复使用
    delete codeStore[email];

    // 查库：这个邮箱注册过吗？
    let user = await User.findOne({ email });

    if (!user) {
      // ✅ 没注册过 -> 自动静默注册
      const randomUsername = 'user_' + Math.random().toString(36).substring(2, 8);
      user = new User({
        username: randomUsername,
        password: randomUsername, // 给个随机密码
        nickname: '组队萌新_' + code.substring(0,4),
        email: email,
        emailVerified: true // 标记为真实邮箱
      });
      await user.save();
    } else {
      // ✅ 注册过 -> 顺便把老用户的状态更新为“已真实有效”
      if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
      }
    }

    // 签发 Token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        college: user.college, // ✅ 融合队友代码
        major: user.major,     // ✅ 融合队友代码
        role: user.role        // ✅ 融合队友代码
      }
    });
  } catch (error) {
    console.error('邮箱登录错误:', error);
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

// ==========================================
// 3. 原有的密码注册 (保留，并加入了抢占逻辑)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname, email } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' })
    }
    
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    // 邮箱抢占逻辑
    if (email) {
      const conflictUser = await User.findOne({ email });
      if (conflictUser) {
        if (conflictUser.emailVerified) {
          return res.status(400).json({ message: '该邮箱已被真实注册' });
        } else {
          conflictUser.email = '';
          await conflictUser.save();
        }
      }
    }
    
    const user = new User({
      username,
      password,
      nickname: nickname || username,
      email: email || '',
      emailVerified: false // 旧版注册默认未验证
    })
    
    await user.save()
    
    const token = jwt.sign(
      { userId: user._id, username: user.username }, 
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '7d' }
    )
    
    // ✅ 融合队友代码: 返回 role
    res.status(201).json({ message: '注册成功', token, user: { id: user._id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role } })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ message: '注册失败', error: error.message })
  }
})

// ==========================================
// 4. 原有的账号密码登录 (支持多字段)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ message: '账号和密码不能为空' })
    }
    
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username },
        { phone: username }
      ]
    })
    
    if (!user) {
      return res.status(400).json({ message: '账号或密码错误' })
    }
    
    const isValid = await user.comparePassword(password)
    if (!isValid) {
      return res.status(400).json({ message: '账号或密码错误' })
    }
    
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '7d' }
    )
    
    // ✅ 融合队友代码: 返回 role
    res.json({ message: '登录成功', token, user: { id: user._id, username: user.username, nickname: user.nickname, avatar: user.avatar, college: user.college, major: user.major, role: user.role } })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ message: '登录失败', error: error.message })
  }
})

module.exports = router