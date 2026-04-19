const express = require('express')
const Post = require('../models/Post')
const Tag = require('../models/Tag')
const User = require('../models/User')

const router = express.Router()

// 搜索
router.get('/', async (req, res) => {
  try {
    const { q, tag, page = 1, pageSize = 10 } = req.query
    
    let query = { status: 'published' }
    
    if (tag) {
      query.tags = tag
    } else if (q) {
      query.$text = { $search: q }
    }
    
    const posts = await Post.find(query)
      .populate('author', 'nickname avatar college')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
    
    const total = await Post.countDocuments(query)
    
    // 获取相关标签
    let relatedTags = []
    if (q || tag) {
      const tagQuery = q ? { $text: { $search: q } } : {}
      const postsForTags = await Post.find(tagQuery).limit(100)
      
      const tagCount = {}
      postsForTags.forEach(post => {
        post.tags.forEach(t => {
          if (t !== tag) {
            tagCount[t] = (tagCount[t] || 0) + 1
          }
        })
      })
      
      relatedTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, displayName: name, count }))
    }
    
    res.json({
      posts,
      hasMore: page * pageSize < total,
      total,
      relatedTags
    })
  } catch (error) {
    res.status(500).json({ message: '搜索失败', error: error.message })
  }
})

// 获取热门标签
router.get('/hot-tags', async (req, res) => {
  try {
    const tags = await Tag.find()
      .sort({ useCount: -1 })
      .limit(20)
    
    res.json(tags)
  } catch (error) {
    res.status(500).json({ message: '获取标签失败' })
  }
})

module.exports = router