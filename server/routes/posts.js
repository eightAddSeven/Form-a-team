const express = require('express')
const Post = require('../models/Post')
const User = require('../models/User')
const auth = require('../middleware/auth')
const router = express.Router()

// 获取单个帖子 
router.get('/:id', async (req, res) => {
  try {
    console.log('获取帖子详情, id:', req.params.id)
    
    const post = await Post.findById(req.params.id)
      .populate('author', 'nickname avatar college bio')
      .lean()
    
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }
    
    // 增加浏览量
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })
    
    // 添加 id 字段方便前端使用
    const responsePost = {
      ...post,
      id: post._id,
      isLiked: false,  // 实际应根据当前用户判断
      isCollected: false
    }
    
    res.json(responsePost)
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    
    // 处理无效的 ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: '无效的帖子ID' })
    }
    
    res.status(500).json({ message: '获取帖子失败', error: error.message })
  }
})

// 创建帖子 - 需要登录
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category, tags, attachments } = req.body
    
    console.log('创建帖子请求:', { 
      userId: req.userId, 
      title, 
      contentLength: content?.length 
    })
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '内容不能为空' })
    }
    
    // 验证用户是否存在
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    // 创建帖子
    const post = new Post({
      title: title || '',
      content,
      category: category || 'other',
      tags: tags || [],
      attachments: attachments || [],
      author: req.userId,
      status: 'published'
    })
    
    await post.save()
    console.log('帖子保存成功:', post._id)
    
    // 填充作者信息
    await post.populate('author', 'nickname avatar college')
    
    // 返回时添加 id 字段
    const responsePost = {
      ...post.toObject(),
      id: post._id,
      isLiked: false,
      isCollected: false
    }
    
    res.status(201).json(responsePost)
  } catch (error) {
    console.error('创建帖子失败:', error)
    res.status(500).json({ 
      message: '创建帖子失败', 
      error: error.message 
    })
  }
})

// 获取单个帖子
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'nickname avatar college')
    
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }
    
    res.json({
      ...post.toObject(),
      id: post._id
    })
  } catch (error) {
    console.error('获取帖子失败:', error)
    res.status(500).json({ message: '获取帖子失败' })
  }
})

// 点赞帖子
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }
    
    const likeIndex = post.likes.indexOf(req.userId)
    if (likeIndex === -1) {
      post.likes.push(req.userId)
    } else {
      post.likes.splice(likeIndex, 1)
    }
    
    await post.save()
    
    res.json({
      likes: post.likes.length,
      isLiked: likeIndex === -1
    })
  } catch (error) {
    console.error('点赞失败:', error)
    res.status(500).json({ message: '点赞失败' })
  }
})

// 删除帖子
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

// 点赞帖子
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
    
    res.json({
      likes: post.likes.length,
      isLiked
    })
  } catch (error) {
    console.error('点赞失败:', error)
    res.status(500).json({ message: '点赞失败' })
  }
})

// 添加评论
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
    
    // 填充作者信息
    await post.populate('comments.author', 'nickname avatar')
    const newComment = post.comments[post.comments.length - 1]
    
    res.status(201).json(newComment)
  } catch (error) {
    console.error('评论失败:', error)
    res.status(500).json({ message: '评论失败' })
  }
})

module.exports = router