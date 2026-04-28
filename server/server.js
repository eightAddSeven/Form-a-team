const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
require('dotenv').config()

const app = express()
// 使用 http 包装 express app，以便挂载 Socket.io
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // 允许 Vue 前端连接
    methods: ["GET", "POST"]
  }
})

// ========== 1. 基础中间件 ==========
// 中间件
app.use(cors())
// ✅ 增加 limit 限制，允许接收 Base64 编码的图片数据
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 开放 uploads 目录作为静态资源，解决头像不显示问题
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 测试路由
app.get('/', (req, res) => {
  res.json({ 
    message: 'CUG 学术社区 API 服务运行中',
    mongodb: mongoose.connection.readyState === 1 ? '已连接' : '未连接'
  })
})

// ========== 2. 挂载原有业务路由 ==========
const authRoutes = require('./routes/auth')
const postsRoutes = require('./routes/posts')
const usersRoutes = require('./routes/users')
const searchRoutes = require('./routes/search')

app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/search', searchRoutes)

// ========== 3. 消息与聊天模块 API ==========
const Message = require('./models/Message')
const auth = require('./middleware/auth')

// 3.1 获取当前用户的“最近聊天列表” (聚合查询)
app.get('/api/messages/conversations', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const conversations = await Message.aggregate([
      { 
        $match: { 
          $or: [{ senderId: userId }, { receiverId: userId }],
          deletedBy: { $ne: userId } // ✅ 核心过滤：不查询自己已经删除的消息
        } 
      },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: "$roomId",
          latestMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: { 
              $cond: [ { $and: [ { $eq: ["$receiverId", userId] }, { $eq: ["$isRead", false] } ] }, 1, 0 ] 
            }
          }
      }},
      { $sort: { "latestMessage.createdAt": -1 } }
    ]);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

// 3.2 获取全局未读消息总数
app.get('/api/messages/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ 
      receiverId: req.userId, 
      isRead: false,
      deletedBy: { $ne: req.userId } // ✅ 过滤掉已删除的未读消息
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: '获取未读数失败' });
  }
});

// 3.3 将某个房间的消息标记为已读
app.put('/api/messages/read/:roomId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { roomId: req.params.roomId, receiverId: req.userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '更新已读状态失败' });
  }
});

// 3.4 获取某个房间的历史消息
app.get('/api/messages/:roomId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ 
      roomId: req.params.roomId,
      deletedBy: { $ne: req.userId } // ✅ 核心过滤：不返回自己删掉的历史记录
    }).sort({ createdAt: 1 }).lean();
    
    res.json(messages || []); 
  } catch (err) {
    res.status(500).json({ error: '获取历史消息失败' });
  }
});

// 3.5 ✅ 新增：软删除聊天记录
app.delete('/api/messages/:roomId', auth, async (req, res) => {
  try {
    // 把当前用户的 ID 塞进该房间所有消息的 deletedBy 数组中
    await Message.updateMany(
      { roomId: req.params.roomId },
      { $addToSet: { deletedBy: req.userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除聊天失败' });
  }
});

// ========== 4. Socket.io 实时通讯逻辑 ==========
io.on('connection', (socket) => {
  console.log('✅ 用户连接 Socket:', socket.id);

  // 加入指定的聊天室 (双方在同一个房间)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  // 加入用户的全局私人频道 (用于接收新消息小红点通知)
  socket.on('join_global', (userId) => {
    socket.join(`user_${userId}`);
  });

  // 接收前端发来的消息并处理
  socket.on('send_message', async (data) => {
    try {
      // 1. 存入 MongoDB
      const newMessage = new Message(data);
      await newMessage.save();

      // 2. 发送给当前聊天界面房间内的所有人 (包括发送者自己)
      io.to(data.roomId).emit('receive_message', data);
      
      // 3. 发送给接收者的全局私人频道，触发导航栏小红点更新
      io.to(`user_${data.receiverId}`).emit('new_unread_message'); 
    } catch (err) {
      console.error('❌ 消息保存失败:', err.message);
      console.error('异常数据包:', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ 用户断开 Socket:', socket.id);
  });
});

// ========== 5. 错误处理 ==========
// 404 处理
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack)
  res.status(500).json({ message: '服务器错误', error: err.message })
})

// ========== 6. 启动与数据库连接 ==========
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

// 注意：挂载了 Socket 后，必须使用 server.listen 而不是 app.listen
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
})