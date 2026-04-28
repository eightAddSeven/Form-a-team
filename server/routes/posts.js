const express = require('express')
const router = express.Router()
const Post = require('../models/Post')
const User = require('../models/User')
const auth = require('../middleware/auth')

// ========== 列表接口 ==========
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category = 'all', tab = 'latest' } = req.query
    
    // 构建查询条件
    let query = { status: 'published' }
    if (category !== 'all') {
      query.category = category
    }

    // 构建排序条件
    let sortOption = { createdAt: -1 }
    if (tab === 'hot') {
      sortOption = { heatScore: -1, createdAt: -1 }
    } else if (tab === 'latest') {
      sortOption = { createdAt: -1 }
    } else if (tab === 'recommend') {
      sortOption = { heatScore: -1, views: -1 }
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const total = await Post.countDocuments(query)
    
    const posts = await Post.find(query)
      .populate('author', 'nickname avatar')
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

// ========== 发布帖子 ==========
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
// 4. 获取单个帖子详情（修复版）
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'nickname avatar college major bio')
      .populate('comments.author', 'nickname avatar')
      .lean()

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' })
    }

    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })

    // ✅ 保留 comments 为数组，新增 commentCount 字段
    const commentsArray = Array.isArray(post.comments) ? post.comments : []
    const likesArray = Array.isArray(post.likes) ? post.likes : []

    res.json({
      ...post,
      id: post._id,
      createTime: post.createdAt,
      comments: commentsArray,                      // 保留数组
      commentCount: commentsArray.length,           // 新增数量字段
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

// ==========================================
// 6. 添加评论（健壮版）
// ==========================================
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body
    const userId = req.userId
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: '评论内容不能为空' })
    }
    
    // 查找帖子
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }
    
    // 添加评论子文档
    const newComment = {
      author: req.userId,
      content: content.trim(),
      createdAt: new Date()
    }
    
    post.comments.push(newComment);
    await post.updateHeatScore()
    await post.populate('comments.author', 'nickname avatar')
    // 保存帖子
    const savedPost = await post.save();
    console.log('✅ 评论已保存，当前评论数:', savedPost.comments.length);
    
    // 重新查询并 populate 作者信息（只 populate 最新评论）
    const populatedPost = await Post.findById(post._id)
      .populate({
        path: 'comments.author',
        select: 'nickname avatar'
      });
    
    const addedComment = populatedPost.comments[populatedPost.comments.length - 1];
    
    // 返回新评论
    res.status(201).json(addedComment);
  } catch (error) {
    console.error('❌ 评论保存失败:', error);
    res.status(500).json({ message: '评论失败', error: error.message });
  }
});


//========== 收藏/取消收藏 ==========
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
//删除评论
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    // 找到对应的评论子文档
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 权限检查：只有评论作者或帖子作者可以删除
    const isCommentAuthor = comment.author.toString() === req.userId;
    const isPostAuthor = post.author.toString() === req.userId;

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: '没有删除此评论的权限' });
    }

    // 删除评论
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
// ========== 删除帖子 ==========
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