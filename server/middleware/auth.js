const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
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