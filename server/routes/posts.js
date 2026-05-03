const express = require('express')
const router = express.Router()
const Post = require('../models/Post')
const User = require('../models/User')
const { auth } = require('../middleware/auth')
const jwt = require('jsonwebtoken')
const keywordFilter = require('../middleware/keywordFilter') // 新增敏感词检测中间件

// ========== 列表接口 ==========
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category = 'all', tab = 'latest' } = req.query
    
    let query = { status: 'published' }
    if (category !== 'all') {
      query.category = category
    }

    let sortOption = { createdAt: -1 }
    
    if (tab === 'hot') {
      sortOption = { heatScore: -1, views: -1, createdAt: -1 }
    } else if (tab === 'recommend') {
      sortOption = { heatScore: -1, views: -1 }
    }

    if (tab === 'follow' || tab === 'following') {
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.json({ posts: [], hasMore: false, total: 0 })
      }
      
      try {
        const token = authHeader.replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key')
        
        const currentUser = await User.findById(decoded.userId)
        
        if (currentUser && currentUser.following && currentUser.following.length > 0) {
          query.author = { $in: currentUser.following }
        } else {
          return res.json({ posts: [], hasMore: false, total: 0 })
        }
      } catch (e) {
        return res.status(401).json({ message: '登录状态无效，请重新登录' })
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const total = await Post.countDocuments(query)
    
    const posts = await Post.find(query)
      .populate('author', 'nickname avatar role')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean()

    const responsePosts = posts.map(post => ({
      ...post,
      id: post._id,
      createTime: post.createdAt,
      likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
      comments: Array.isArray(post.comments) ? post.comments.length : (post.comments || 0),
      tags: Array.isArray(post.tags) ? post.tags : [],
      isLiked: false,
      isCollected: false
    }))
    
    res.json({
      posts: responsePosts,
      hasMore: skip + posts.length < total,
      total
    })
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    res.status(500).json({ message: '获取帖子列表失败', error: error.message })
  }
})

// 获取指定用户的帖子
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    
    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    const posts = await Post.find({ 
      author: req.params.userId,
      status: 'published' 
    })
      .populate('author', 'nickname avatar college bio role')
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
      tags: Array.isArray(post.tags) ? post.tags : [],
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

// 发布帖子（添加禁言检查 + 敏感词过滤）
router.post('/', auth, keywordFilter, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser && currentUser.bannedUntil && currentUser.bannedUntil > new Date()) {
      return res.status(403).json({ 
        message: `您已被禁言至 ${currentUser.bannedUntil.toLocaleString()}，暂时无法发布帖子` 
      });
    }

    const { title, content, category, tags, attachments } = req.body
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '内容不能为空' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    let processedTags = []
    if (Array.isArray(tags)) {
      processedTags = tags.map(tag => {
        if (typeof tag === 'string') return tag.trim()
        if (tag && typeof tag === 'object') {
          return (tag.displayName || tag.name || '').trim()
        }
        return ''
      }).filter(tag => tag !== '')
    }

    const post = new Post({
      title: title || '',
      content,
      category: category || 'other',
      tags: processedTags,
      attachments: attachments || [],
      author: req.userId,
      status: 'published',
      likes: [],
      comments: []
    })
    
    await post.save()
    await post.populate('author', 'nickname avatar college role')
    
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

// 获取单个帖子详情
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'nickname avatar college major bio role')
      .populate('comments.author', 'nickname avatar role')
      .lean()

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })

    const commentsArray = Array.isArray(post.comments) ? post.comments : []
    const likesArray = Array.isArray(post.likes) ? post.likes : []

    res.json({
      ...post,
      id: post._id,
      createTime: post.createdAt,
      comments: commentsArray,
      commentCount: commentsArray.length,
      likes: likesArray,
      likeCount: likesArray.length,
      isLiked: false,
      isCollected: false
    })
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    res.status(500).json({ message: '获取失败' })
  }
})

// 点赞
router.post('/:id/like', auth, async (req, res) => {
  try {
    const userId = req.userId
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    const likeIndex = post.likes.findIndex(id => id.toString() === userId.toString())
    let isLiked = false

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1)
      isLiked = false
    } else {
      post.likes.push(userId)
      isLiked = true
    }

    await post.updateHeatScore()

    res.json({
      success: true,
      isLiked,
      likes: post.likes,
      likeCount: post.likes.length,
      heatScore: post.heatScore
    })
  } catch (e) {
    console.error('点赞失败:', e)
    res.status(500).json({ error: e.message })
  }
})

// 添加评论（添加禁言检查 + 敏感词过滤）
router.post('/:id/comments', auth, keywordFilter, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser && currentUser.bannedUntil && currentUser.bannedUntil > new Date()) {
      return res.status(403).json({ 
        message: `您已被禁言至 ${currentUser.bannedUntil.toLocaleString()}，暂时无法发表评论` 
      });
    }

    const { content } = req.body
    const userId = req.userId
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '评论内容不能为空' })
    }
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }
    
    const newComment = {
      author: req.userId,
      content: content.trim(),
      createdAt: new Date()
    }
    
    post.comments.push(newComment);
    await post.updateHeatScore()
    await post.populate('comments.author', 'nickname avatar role')
    const savedPost = await post.save();
    
    const populatedPost = await Post.findById(post._id)
      .populate({
        path: 'comments.author',
        select: 'nickname avatar role'
      });
    
    const addedComment = populatedPost.comments[populatedPost.comments.length - 1];
    
    res.status(201).json(addedComment);
  } catch (error) {
    console.error('评论保存失败:', error);
    res.status(500).json({ message: '评论失败', error: error.message });
  }
});

// 收藏/取消收藏
router.post('/:id/collect', auth, async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.userId

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    const collectIndex = user.collections.findIndex(
      id => id.toString() === postId.toString()
    )

    let isCollected = false
    if (collectIndex > -1) {
      user.collections.splice(collectIndex, 1)
      isCollected = false
    } else {
      user.collections.push(postId)
      isCollected = true
    }

    await user.save()

    res.json({
      success: true,
      isCollected,
      collectionsCount: user.collections.length
    })
  } catch (e) {
    console.error('收藏操作失败:', e)
    res.status(500).json({ error: e.message })
  }
})

// 热搜榜单
router.get('/hot-rank/list', async (req, res) => {
  try {
    const { limit = 8 } = req.query

    const hotPosts = await Post.find({ status: 'published' })
      .select('_id title heatScore views likes comments createdAt author')
      .populate('author', 'nickname avatar role')
      .sort({ heatScore: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .lean()

    const rankedPosts = hotPosts.map((post, index) => {
      const calculation = Post.calculateHeatScore(post)
      return {
        rank: index + 1,
        postId: post._id,
        title: post.title || '无标题',
        author: post.author,
        heat: calculation.heatScore,
        heatMetrics: calculation.heatMetrics,
        stats: {
          views: post.views || 0,
          likes: post.likes?.length || 0,
          comments: post.comments?.length || 0
        },
        createdAt: post.createdAt,
        url: `/post/${post._id}`
      }
    })

    res.json({
      success: true,
      data: rankedPosts,
      updateTime: new Date().toISOString()
    })
  } catch (err) {
    console.error('获取热搜榜单失败:', err)
    res.status(500).json({ success: false, data: [], error: err.message })
  }
})

// 删除评论
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    const isCommentAuthor = comment.author.toString() === req.userId;
    const isPostAuthor = post.author.toString() === req.userId;

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: '没有删除此评论的权限' });
    }

    comment.deleteOne();
    await post.save();

    res.json({ 
      message: '删除成功',
      commentId: req.params.commentId 
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ message: '删除评论失败', error: error.message });
  }
});

// ========== 删除帖子（修改权限逻辑：作者或管理员） ==========
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    if (post.author.toString() !== req.userId && user.role !== 'admin') {
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