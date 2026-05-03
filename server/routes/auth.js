const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const router = express.Router()

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname, email } = req.body
    
    console.log('注册请求:', { username, nickname, email })
    
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' })
    }
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' })
    }
    
    // 创建新用户
    const user = new User({
      username,
      password,
      nickname: nickname || username,
      email: email || ''
    })
    
    await user.save()
    console.log('用户创建成功:', user._id)
    
    // 生成 token
    const token = jwt.sign(
      { userId: user._id, username: user.username }, 
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '7d' }
    )
    
    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role         // 新增：返回角色
      }
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ message: '注册失败', error: error.message })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    console.log('登录请求:', { username, password: password ? '***' : '空' })
    
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' })
    }
    
    // 查找用户
    const user = await User.findOne({ username })
    if (!user) {
      console.log('用户不存在:', username)
      return res.status(400).json({ message: '用户名或密码错误' })
    }
    
    console.log('找到用户:', user._id, '密码哈希:', user.password ? user.password.substring(0, 20) + '...' : '无')
    
    // 验证密码
    const isValid = await user.comparePassword(password)
    console.log('密码验证结果:', isValid)
    
    if (!isValid) {
      return res.status(400).json({ message: '用户名或密码错误' })
    }
    
    // 生成 token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '7d' }
    )
    
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        college: user.college,
        major: user.major,
        role: user.role         // 新增：返回角色
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ message: '登录失败', error: error.message })
  }
})

module.exports = router