const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['all', 'competition', 'research', 'team', 'question','other'],
    default: 'all'
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'deleted'],
    default: 'published'
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  heatScore: {
    type: Number,
    default: 0,
    index: -1
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// 静态方法：计算热度（含时间衰减）
postSchema.statics.calculateHeatScore = function(post) {
  const now = new Date()
  const createdAt = new Date(post.createdAt)
  const ageInMs = now - createdAt
  const DECAY_PERIOD = 1 * 24 * 60 * 60 * 1000 
  const timeDecay = 1 / (1 + ageInMs / DECAY_PERIOD)

  const views = post.views || 0
  const likes = Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)
  const comments = Array.isArray(post.comments) ? post.comments.length : (post.comments || 0)

  const VIEW_WEIGHT = 0.3
  const LIKE_WEIGHT = 2
  const COMMENT_WEIGHT = 5

  const interactionScore = views * VIEW_WEIGHT + likes * LIKE_WEIGHT + comments * COMMENT_WEIGHT
  const heatScore = Math.round(interactionScore * timeDecay * 100) / 100

  return {
    heatScore,
    heatMetrics: {
      views,
      likes,
      comments,
      ageInHours: Math.round(ageInMs / (60 * 60 * 1000) * 10) / 10,
      timeDecay: Math.round(timeDecay * 1000) / 1000,
      interactionScore: Math.round(interactionScore * 100) / 100
    }
  }
}

// 实例方法：更新热度
postSchema.methods.updateHeatScore = async function() {
  const calculation = this.constructor.calculateHeatScore(this)
  this.heatScore = calculation.heatScore
  this.updatedAt = new Date()
  return this.save()
}

// 保存前自动计算热度
postSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('views') || this.isModified('likes') || this.isModified('comments')) {
    const calculation = this.constructor.calculateHeatScore(this)
    this.heatScore = calculation.heatScore
    this.updatedAt = new Date()
  }
  next()
})

// 批量更新全站热度（用于定时任务）
postSchema.statics.updateAllHeatScores = async function() {
  const posts = await this.find({ status: 'published' })
  const bulkOps = posts.map(post => ({
    updateOne: {
      filter: { _id: post._id },
      update: { heatScore: this.calculateHeatScore(post).heatScore }
    }
  }))
  if (bulkOps.length > 0) {
    await this.bulkWrite(bulkOps)
  }
  return posts.length
}

const Post = mongoose.model('Post', postSchema)
module.exports = Post