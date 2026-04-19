const mongoose = require('mongoose')

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['competition', 'research', 'custom'],
    default: 'custom'
  },
  category: String,
  type: String,
  college: String,
  useCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Tag', tagSchema)