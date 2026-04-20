const express = require('express')
const router = express.Router()
const Post = require('../models/Post')
const User = require('../models/User')
const auth = require('../middleware/auth')

// ========== 列表接口 ==========
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category = 'all', tab = 'latest' } = req.query
    const skip = (page - 1) * pageSize

    let sortOption = {}
    if (tab === 'hot') {
      sortOption = { heatScore: -1, createdAt: -1 }
    } else if (tab === 'latest') {
      sortOption = { createdAt: -1 }
    } else if (tab === 'recommend') {
      sortOption = { heatScore: -1, views: -1 }
    }

    let query = { status: 'published' }
    if (category !== 'all') {
      query.category = category
    }

    const total = await Post.countDocuments(query)

    const posts = await Post.find(query)
      .populate('author', 'nickname avatar')
      .populate('comments.author', 'nickname avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(pageSize))
      .lean()

    const postsWithUpdatedHeat = posts.map(post => {
      const calculation = Post.calculateHeatScore(post)
      return {
        ...post,
        heatScore: calculation.heatScore,
        heatMetrics: calculation.heatMetrics
      }
    })

    res.json({
      data: postsWithUpdatedHeat,
      total,
      hasMore: skip + posts.length < total,
      currentPage: parseInt(page)
    })
  } catch (err) {
    console.error('获取帖子列表失败:', err)
    res.status(500).json({ data: [], total: 0, hasMore: false, error: err.message })
  }
})

// ========== 发布帖子 ==========
router.post('/', auth, async (req, res) => {
  try {
    const validCategories = ['all', 'competition', 'research', 'team', 'question']
    let category = req.body.category
    if (!category || !validCategories.includes(category)) {
      category = 'all'
    }

    const post = new Post({
      ...req.body,
      category,
      author: req.userId
    })
    await post.save()
    await post.populate('author', 'nickname avatar')
    res.status(201).json(post)
  } catch (e) {
    console.error('发布失败:', e)
    res.status(500).json({ error: e.message })
  }
})

// ========== 详情 + 浏览量更新 ==========
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'nickname avatar college major bio')
      .populate('comments.author', 'nickname avatar')

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    post.views = (post.views || 0) + 1
    await post.updateHeatScore()
    await post.populate('author', 'nickname avatar college major bio')

    res.json(post)
  } catch (e) {
    console.error('获取详情失败:', e)
    res.status(404).json({ error: e.message })
  }
})

// ========== 点赞 ==========
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

// ========== 评论 ==========
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body
    const userId = req.userId

    if (!content) {
      return res.status(400).json({ error: '评论内容不能为空' })
    }

    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    const newComment = {
      author: userId,
      content: content.trim(),
      createdAt: new Date()
    }

    post.comments.push(newComment)
    await post.updateHeatScore()
    await post.populate('comments.author', 'nickname avatar')

    res.status(201).json({
      success: true,
      comment: post.comments[post.comments.length - 1],
      commentCount: post.comments.length,
      heatScore: post.heatScore
    })
  } catch (e) {
    console.error('评论失败:', e)
    res.status(500).json({ error: e.message })
  }
})

// ========== 删除评论 ==========
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    const commentIndex = post.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    )
    if (commentIndex === -1) {
      return res.status(404).json({ error: '评论不存在' })
    }

    if (post.comments[commentIndex].author.toString() !== req.userId) {
      return res.status(403).json({ error: '无权删除此评论' })
    }

    post.comments.splice(commentIndex, 1)
    await post.updateHeatScore()

    res.json({
      success: true,
      commentCount: post.comments.length,
      heatScore: post.heatScore
    })
  } catch (e) {
    console.error('删除评论失败:', e)
    res.status(500).json({ error: e.message })
  }
})

// ========== 收藏/取消收藏 ==========
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

// ========== 热搜榜单 ==========
router.get('/hot-rank/list', async (req, res) => {
  try {
    const { limit = 8 } = req.query

    const hotPosts = await Post.find({ status: 'published' })
      .select('_id title heatScore views likes comments createdAt author')
      .populate('author', 'nickname avatar')
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

// ========== 删除帖子 ==========
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ error: '无权删除此帖子' })
    }
    await Post.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (e) {
    console.error('删除失败:', e)
    res.status(500).json({ error: e.message })
  }
})

module.exports = router