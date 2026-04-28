const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, default: '未知用户' },
  senderAvatar: { type: String, default: '' },
  
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverName: { type: String, default: '未知用户' },
  receiverAvatar: { type: String, default: '' },
  
  text: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  
  createdAt: { type: Date, default: Date.now, expires: '30d' }
});

module.exports = mongoose.model('Message', messageSchema);