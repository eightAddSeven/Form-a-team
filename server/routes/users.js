const express = require('express')
const User = require('../models/User')
const Post = require('../models/Post')
const auth = require('../middleware/auth')
const router = express.Router()

// 获取用户信息
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'nickname avatar')
      .populate('following', 'nickname avatar')
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    // 获取用户的帖子数量
    const postCount = await Post.countDocuments({ author: user._id })
    
    // 获取用户获得的点赞总数
    const posts = await Post.find({ author: user._id })
    const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0)
    
    res.json({
      ...user.toObject(),
      id: user._id,
      posts: postCount,
      likes: totalLikes
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({ message: '获取用户信息失败' })
  }
})

// 更新用户信息
router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname, bio, college, major, grade, avatar, cover } = req.body
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { nickname, bio, college, major, grade, avatar, cover },
      { new: true }
    ).select('-password')
    
    res.json(user)
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({ message: '更新失败' })
  }
})

// 关注用户
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: '不能关注自己' })
    }
    
    const targetUser = await User.findById(req.params.id)
    const currentUser = await User.findById(req.userId)
    
    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    const isFollowing = currentUser.following.includes(req.params.id)
    
    if (isFollowing) {
      // 取消关注
      currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id)
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.userId)
    } else {
      // 关注
      currentUser.following.push(req.params.id)
      targetUser.followers.push(req.userId)
    }
    
    await currentUser.save()
    await targetUser.save()
    
    res.json({
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    })
  } catch (error) {
    console.error('关注操作失败:', error)
    res.status(500).json({ message: '操作失败' })
  }
})

// 获取用户的帖子
router.get('/:id/posts', async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    
    const posts = await Post.find({ 
      author: req.params.id,
      status: 'published'
    })
      .populate('author', 'nickname avatar college')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean()
    
    const total = await Post.countDocuments({ author: req.params.id })
    
    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      id: post._id,
      isLiked: false
    }))
    
    res.json({
      posts: postsWithLikeStatus,
      hasMore: page * pageSize < total,
      total
    })
  } catch (error) {
    console.error('获取用户帖子失败:', error)
    res.status(500).json({ message: '获取失败' })
  }
})

// 获取用户的收藏
router.get('/:id/collections', auth, async (req, res) => {
  try {
    // 这里需要 Collection 模型，暂时返回空
    res.json({ collections: [], hasMore: false })
  } catch (error) {
    res.status(500).json({ message: '获取失败' })
  }
})

// ==========================================
// 获取用户的关注列表
// ==========================================
router.get('/:id/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'nickname avatar bio college')
      .lean()
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    const following = (user.following || []).map(u => ({
      ...u,
      id: u._id,
      isFollowing: true
    }))
    
    res.json(following)
  } catch (error) {
    console.error('获取关注列表失败:', error)
    res.status(500).json({ message: '获取失败' })
  }
})

// ==========================================
// 获取用户的粉丝列表
// ==========================================
router.get('/:id/followers', async (req, res) => {
  try {
    // 获取当前登录用户ID
    let currentUserId = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key')
        currentUserId = decoded.userId
      } catch (e) {}
    }
    
    const user = await User.findById(req.params.id)
      .populate('followers', 'nickname avatar bio college')
      .lean()
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    // 获取当前用户的关注列表
    let currentUserFollowing = []
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId)
      currentUserFollowing = currentUser?.following.map(id => id.toString()) || []
    }
    
    const followers = (user.followers || []).map(u => ({
      ...u,
      id: u._id,
      isFollowing: currentUserFollowing.includes(u._id.toString())
    }))
    
    res.json(followers)
  } catch (error) {
    console.error('获取粉丝列表失败:', error)
    res.status(500).json({ message: '获取失败' })
  }
})

module.exports = router