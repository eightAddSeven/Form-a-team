const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 测试路由
app.get('/', (req, res) => {
  res.json({ 
    message: 'CUG 学术社区 API 服务运行中',
    mongodb: mongoose.connection.readyState === 1 ? '已连接' : '未连接'
  })
})

// 路由 - 确保每个路由文件正确导出
const authRoutes = require('./routes/auth')
const postsRoutes = require('./routes/posts')
const usersRoutes = require('./routes/users')
const searchRoutes = require('./routes/search')

// 检查路由是否正确加载
console.log('authRoutes 类型:', typeof authRoutes)
console.log('postsRoutes 类型:', typeof postsRoutes)

app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/search', searchRoutes)

// 404 处理
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack)
  res.status(500).json({ message: '服务器错误', error: err.message })
})

// 连接 MongoDB
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ 请在 .env 文件中设置 MONGODB_URI')
  process.exit(1)
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas 连接成功'))
  .catch(err => {
    console.error('❌ MongoDB 连接失败:', err.message)
  })

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
})

const Post = require('./models/Post')
Post.findOne().then(p => console.log('heatScore 类型:', typeof p?.heatScore, '值:', p?.heatScore))