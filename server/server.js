const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

// ========== 1. 基础中间件 ==========
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (req, res) => {
  res.json({ 
    message: 'CUG 学术社区 API 服务运行中',
    mongodb: mongoose.connection.readyState === 1 ? '已连接' : '未连接'
  })
})

// ========== 2. 挂载业务路由 ==========
const authRoutes = require('./routes/auth')
const postsRoutes = require('./routes/posts')
const usersRoutes = require('./routes/users')
const searchRoutes = require('./routes/search')
const keywordsRoutes = require('./routes/keywords')

app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/admin/keywords', keywordsRoutes)

// ========== 3. 消息与聊天模块 ==========
const Message = require('./models/Message')
const { auth } = require('./middleware/auth')

app.get('/api/messages/conversations', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const conversations = await Message.aggregate([
      { 
        $match: { 
          $or: [{ senderId: userId }, { receiverId: userId }],
          deletedBy: { $ne: userId }
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

app.get('/api/messages/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ 
      receiverId: req.userId, 
      isRead: false,
      deletedBy: { $ne: req.userId }
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: '获取未读数失败' });
  }
});

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

app.get('/api/messages/:roomId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ 
      roomId: req.params.roomId,
      deletedBy: { $ne: req.userId }
    }).sort({ createdAt: 1 }).lean();
    res.json(messages || []); 
  } catch (err) {
    res.status(500).json({ error: '获取历史消息失败' });
  }
});

app.delete('/api/messages/:roomId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { roomId: req.params.roomId },
      { $addToSet: { deletedBy: req.userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除聊天失败' });
  }
});

// ========== 4. Socket.io 实时通讯 ==========
const User = require('./models/User'); // 引入 User 模型以检查禁言状态

io.on('connection', (socket) => {
  console.log('✅ 用户连接 Socket:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('join_global', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('send_message', async (data, callback) => {
  try {
    const sender = await User.findById(data.senderId);
    if (sender && sender.bannedUntil && sender.bannedUntil > new Date()) {
      // 如果提供了回调函数，则返回错误
      if (typeof callback === 'function') {
        callback({ error: `您已被禁言至 ${sender.bannedUntil.toLocaleString()}，暂时无法发送私信` });
      }
      return;
    }

    const newMessage = new Message(data);
    await newMessage.save();
    io.to(data.roomId).emit('receive_message', data);
    io.to(`user_${data.receiverId}`).emit('new_unread_message');
    
    // 保存成功，回调无错误
    if (typeof callback === 'function') {
      callback({ success: true });
    }
  } catch (err) {
    console.error('❌ 消息保存失败:', err.message);
    if (typeof callback === 'function') {
      callback({ error: '消息发送失败，请重试' });
    }
  }
});

  socket.on('disconnect', () => {
    console.log('❌ 用户断开 Socket:', socket.id);
  });
});

// ========== 5. 错误处理 ==========
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' })
})

app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack)
  res.status(500).json({ message: '服务器错误', error: err.message })
})

// ========== 6. 数据库连接与管理员初始化 ==========
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ 请在 .env 文件中设置 MONGODB_URI')
  process.exit(1)
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Atlas 连接成功')

    // 自动设置管理员
    const User = require('./models/User');
    try {
      const result = await User.updateOne(
        { username: 'hyw' },
        { $set: { role: 'admin' } }
      );
      if (result.modifiedCount > 0) {
        console.log('✅ 已将用户 hyw 设置为管理员');
      } else if (result.matchedCount > 0) {
        console.log('ℹ️ 用户 hyw 已经是管理员');
      } else {
        console.log('⚠️ 未找到用户 hyw，请先注册该账号');
      }
    } catch (err) {
      console.error('❌ 设置管理员失败:', err.message);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB 连接失败:', err.message)
  })

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
})