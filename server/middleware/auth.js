const jwt = require('jsonwebtoken')
const User = require('../models/User')

// 原有的认证中间件
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  console.log('认证中间件 - token:', token ? '存在' : '不存在')
  
  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌，请先登录' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key')
    req.userId = decoded.userId
    console.log('认证成功 - userId:', req.userId)
    next()
  } catch (error) {
    console.error('认证失败:', error.message)
    res.status(401).json({ message: '无效的认证令牌，请重新登录' })
  }
}

// 新增：管理员权限中间件（必须在 auth 之后使用）
const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('role')
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: '需要管理员权限' })
    }
    next()
  } catch (error) {
    console.error('管理员权限验证失败:', error)
    res.status(500).json({ message: '权限验证失败' })
  }
}

module.exports = { auth, adminAuth }