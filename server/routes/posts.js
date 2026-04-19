const express = require('express')
const Post = require('../models/Post')
const User = require('../models/User')
const auth = require('../middleware/auth')
const router = express.Router()

// ==========================================
// 1. 获取所有帖子列表 (首页用)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category, tab } = req.query
    
    let query = { status: 'published' }
    if (category && category !== 'all') {
      query.category = category
    }
    
    let sort = { createdAt: -1 }
    if (tab === 'hot') {
      sort = { likes: -1, createdAt: -1 }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    const posts = await Post.find(query)
      .populate('author', 'nickname avatar college bio')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Post.countDocuments(query)
    
    // ✅ 关键修复：将 likes 和 comments 转换为数字
    const responsePosts = posts.map(post => ({
      ...post,
      id: post._id,
      createTime: post.createdAt,
      likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
      comments: Array.isArray(post.comments) ? post.comments.length : (post.comments || 0),
      tags: Array.isArray(post.tags) ? post.tags : [],  // ✅ 确保是数组
      isLiked: false,
      isCollected: false
    }))
    
    res.json({
      posts: responsePosts,
      hasMore: skip + responsePosts.length < total,
      total
    })
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    res.status(500).json({ message: '获取帖子列表失败', error: error.message })
  }
})

// ==========================================
// 2. 获取指定用户的帖子
// ==========================================
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    
    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    const posts = await Post.find({ 
      author: req.params.userId,
      status: 'published' 
    })
      .populate('author', 'nickname avatar college bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Post.countDocuments({ author: req.params.userId, status: 'published' })
    
    const responsePosts = posts.map(post => ({
      ...post,
      id: post._id,
      createTime: post.createdAt,
      likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
      comments: Array.isArray(post.comments) ? post.comments.length : (post.comments || 0),
      tags: Array.isArray(post.tags) ? post.tags : [],  // ✅ 确保是数组
      isLiked: false,
      isCollected: false
    }))
    
    res.json({
      posts: responsePosts,
      hasMore: skip + responsePosts.length < total,
      total
    })
  } catch (error) {
    console.error('获取用户帖子失败:', error)
    res.status(500).json({ message: '获取用户帖子失败', error: error.message })
  }
})

// ==========================================
// 3. 创建帖子
// ==========================================
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category, tags, attachments } = req.body
    
    console.log('=== 创建帖子请求 ===')
    console.log('原始 tags:', JSON.stringify(tags))
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '内容不能为空' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    // ✅ 关键修复：处理 tags，确保存储的是字符串数组
    let processedTags = []
    if (Array.isArray(tags)) {
      processedTags = tags.map(tag => {
        // 如果是字符串，直接返回
        if (typeof tag === 'string') {
          return tag.trim()
        }
        // 如果是对象，提取 displayName 或 name
        if (tag && typeof tag === 'object') {
          const tagName = tag.displayName || tag.name || ''
          return tagName.trim()
        }
        return ''
      }).filter(tag => tag !== '') // 过滤空字符串
    }
    
    console.log('处理后的 tags:', processedTags)
    
    const post = new Post({
      title: title || '',
      content,
      category: category || 'other',
      tags: processedTags,  // ✅ 存储纯字符串数组
      attachments: attachments || [],
      author: req.userId,
      status: 'published',
      likes: [],
      comments: []
    })
    
    await post.save()
    console.log('帖子保存成功，ID:', post._id, 'tags:', post.tags)
    
    await post.populate('author', 'nickname avatar college')
    
    // 返回时也保持格式一致
    res.status(201).json({
      ...post.toObject(),
      id: post._id,
      createTime: post.createdAt,
      likes: 0,
      comments: 0,
      isLiked: false,
      isCollected: false
    })
  } catch (error) {
    console.error('创建帖子失败:', error)
    res.status(500).json({ message: '创建帖子失败', error: error.message })
  }
})

// ==========================================
// 4. 获取单个帖子详情
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'nickname avatar college bio')
      .populate('comments.author', 'nickname avatar')
      .lean()
    
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }
    
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })
    
    // ✅ 转换 likes 和 comments 为数字
    res.json({
      ...post,
      id: post._id,
      createTime: post.createdAt,
      likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
      comments: Array.isArray(post.comments) ? post.comments.length : (post.comments || 0),
      isLiked: false,
      isCollected: false
    })
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    res.status(500).json({ message: '获取失败' })
  }
})

// ==========================================
// 5. 点赞帖子
// ==========================================
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }
    
    const likeIndex = post.likes.findIndex(id => id.toString() === req.userId)
    let isLiked = false
    
    if (likeIndex === -1) {
      post.likes.push(req.userId)
      isLiked = true
    } else {
      post.likes.splice(likeIndex, 1)
      isLiked = false
    }
    
    await post.save()
    
    // ✅ 返回数字
    res.json({
      likes: post.likes.length,
      isLiked
    })
  } catch (error) {
    console.error('点赞失败:', error)
    res.status(500).json({ message: '点赞失败' })
  }
})

// ==========================================
// 6. 添加评论
// ==========================================
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '评论内容不能为空' })
    }
    
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }
    
    const comment = {
      author: req.userId,
      content: content.trim(),
      createdAt: new Date()
    }
    
    post.comments.push(comment)
    await post.save()
    
    await post.populate('comments.author', 'nickname avatar')
    const newComment = post.comments[post.comments.length - 1]
    
    res.status(201).json(newComment)
  } catch (error) {
    console.error('评论失败:', error)
    res.status(500).json({ message: '评论失败' })
  }
})

// ==========================================
// 7. 删除帖子
// ==========================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }
    
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: '无权删除此帖子' })
    }
    
    await post.deleteOne()
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除失败:', error)
    res.status(500).json({ message: '删除失败' })
  }
})

module.exports = router