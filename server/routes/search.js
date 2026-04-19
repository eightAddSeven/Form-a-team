const express = require('express')
const Post = require('../models/Post')
const Tag = require('../models/Tag')

const router = express.Router()

// 搜索
router.get('/', async (req, res) => {
  try {
    const { q, tag, page = 1, pageSize = 10 } = req.query
    
    let query = { status: 'published' }
    
    // ✅ 关键修复：必须有搜索条件才返回结果
    const hasSearchCondition = q || tag
    
    if (!hasSearchCondition) {
      // 没有搜索条件时返回空结果
      return res.json({
        posts: [],
        hasMore: false,
        total: 0,
        relatedTags: []
      })
    }
    
    if (tag) {
      // 按标签搜索
      query.tags = tag
    } else if (q) {
      // 按关键词搜索（使用正则表达式，支持模糊匹配）
      const searchRegex = new RegExp(q, 'i')
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ]
    }
    
    console.log('搜索条件:', JSON.stringify(query))
    
    const posts = await Post.find(query)
      .populate('author', 'nickname avatar college')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean()
    
    const total = await Post.countDocuments(query)
    
    // 转换 likes 和 comments 为数字
    const responsePosts = posts.map(post => ({
      ...post,
      id: post._id,
      createTime: post.createdAt,
      likes: Array.isArray(post.likes) ? post.likes.length : (post.likes || 0),
      comments: Array.isArray(post.comments) ? post.comments.length : (post.comments || 0),
      isLiked: false,
      isCollected: false
    }))
    
    // 获取相关标签
    let relatedTags = []
    if (q || tag) {
      // 获取所有包含搜索词的帖子来统计标签
      const tagQuery = {}
      if (q) {
        const searchRegex = new RegExp(q, 'i')
        tagQuery.$or = [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex }
        ]
      } else if (tag) {
        tagQuery.tags = tag
      }
      
      const postsForTags = await Post.find(tagQuery).limit(100).lean()
      
      const tagCount = {}
      postsForTags.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(t => {
            // 不包含当前搜索的标签
            if (t !== tag) {
              tagCount[t] = (tagCount[t] || 0) + 1
            }
          })
        }
      })
      
      relatedTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ 
          name, 
          displayName: name, 
          count,
          source: 'tag'
        }))
    }
    
    console.log(`搜索结果: ${responsePosts.length} 条, 相关标签: ${relatedTags.length} 个`)
    
    res.json({
      posts: responsePosts,
      hasMore: page * pageSize < total,
      total,
      relatedTags
    })
  } catch (error) {
    console.error('搜索失败:', error)
    res.status(500).json({ message: '搜索失败', error: error.message })
  }
})

// 获取热门标签
router.get('/hot-tags', async (req, res) => {
  try {
    // 从帖子中统计标签使用次数
    const posts = await Post.find({ status: 'published' }).limit(500).lean()
    
    const tagCount = {}
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      }
    })
    
    const hotTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({
        name,
        displayName: name,
        count,
        heat: count
      }))
    
    res.json(hotTags)
  } catch (error) {
    console.error('获取热门标签失败:', error)
    // 返回默认热门标签
    res.json([
      { name: '数学建模', displayName: '数学建模', count: 100, heat: 100 },
      { name: 'ACM程序设计', displayName: 'ACM程序设计', count: 80, heat: 80 },
      { name: '挑战杯', displayName: '挑战杯', count: 60, heat: 60 },
      { name: '大创项目', displayName: '大创项目', count: 50, heat: 50 },
      { name: '经验分享', displayName: '经验分享', count: 45, heat: 45 }
    ])
  }
})

module.exports = router