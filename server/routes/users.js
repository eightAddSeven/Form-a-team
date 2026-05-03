const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { auth, adminAuth } = require('../middleware/auth'); // 修改引入方式
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();

// 辅助函数：根据 ID 或 username 查找用户
const findUserByIdOrUsername = async (identifier) => {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const user = await User.findById(identifier);
    if (user) return user;
  }
  return await User.findOne({
    $or: [{ username: identifier }, { nickname: identifier }]
  });
};

// ========== 管理员接口（必须放在 /:id 之前） ==========

// 获取所有用户（管理员专属）
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// 禁言用户（管理员专属）
router.put('/:id/ban', auth, adminAuth, async (req, res) => {
  try {
    const { days } = req.body;
    if (!days || isNaN(days)) {
      return res.status(400).json({ message: '请提供有效的禁言天数' });
    }
    const bannedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { bannedUntil },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({
      message: `已禁言至 ${bannedUntil.toLocaleString()}`,
      bannedUntil: user.bannedUntil
    });
  } catch (error) {
    console.error('禁言失败:', error);
    res.status(500).json({ message: '禁言失败' });
  }
});

// 解除禁言（管理员专属）
router.put('/:id/unban', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { bannedUntil: null },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ message: '已解除禁言', user });
  } catch (error) {
    console.error('解除禁言失败:', error);
    res.status(500).json({ message: '解除禁言失败' });
  }
});

// 删除用户（管理员专属，同时删除该用户所有帖子）
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    // 删除该用户的所有帖子
    await Post.deleteMany({ author: req.params.id });
    res.json({ message: '用户及关联帖子已删除' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ message: '删除用户失败' });
  }
});

// ========== 普通用户接口 ==========

// 获取用户信息
router.get('/:id', async (req, res) => {
  try {
    const user = await findUserByIdOrUsername(req.params.id);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const postCount = await Post.countDocuments({ author: user._id });
    const posts = await Post.find({ author: user._id });
    const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0);

    res.json({
      ...user.toObject(),
      id: user._id,
      posts: postCount,
      likes: totalLikes
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname, bio, college, major, grade, avatar, cover } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { nickname, bio, college, major, grade, avatar, cover },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ message: '更新失败' });
  }
});

// ========== 关注用户 ==========
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;

    console.log(`\n===== 关注操作开始 =====`);
    console.log(`当前用户 ID: ${currentUserId}`);
    console.log(`目标用户 ID: ${targetUserId}`);

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: '无效的用户ID' });
    }
    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: '不能关注自己' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);
    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const isFollowing = currentUser.following.some(id => id.toString() === targetUserId);

    console.log(`操作前 - 当前用户关注列表: ${JSON.stringify(currentUser.following)}`);
    console.log(`操作前 - 目标用户粉丝列表: ${JSON.stringify(targetUser.followers)}`);
    console.log(`是否已关注: ${isFollowing}`);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
    } else {
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    console.log(`操作后 - 当前用户关注列表: ${JSON.stringify(currentUser.following)}`);
    console.log(`操作后 - 目标用户粉丝列表: ${JSON.stringify(targetUser.followers)}`);

    try {
      await currentUser.save();
      console.log('当前用户保存成功');
    } catch (saveError) {
      console.error('当前用户保存失败:', saveError);
      return res.status(500).json({ message: '保存当前用户失败', error: saveError.message });
    }

    try {
      await targetUser.save();
      console.log('目标用户保存成功');
    } catch (saveError) {
      console.error('目标用户保存失败:', saveError);
      return res.status(500).json({ message: '保存目标用户失败', error: saveError.message });
    }

    console.log(`关注操作完成，最终 isFollowing: ${!isFollowing}`);
    console.log(`===== 关注操作结束 =====\n`);

    res.json({
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    console.error('关注操作未捕获异常:', error);
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

// 调试接口
router.get('/debug/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    res.json({
      _id: user._id,
      username: user.username,
      following: user.following,
      followers: user.followers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户帖子
router.get('/:id/posts', async (req, res) => {
  try {
    const user = await findUserByIdOrUsername(req.params.id);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const { page = 1, pageSize = 10 } = req.query;
    const posts = await Post.find({
      author: user._id,
      status: 'published'
    })
      .populate('author', 'nickname avatar college')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean();

    const total = await Post.countDocuments({ author: user._id });

    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      id: post._id,
      isLiked: false
    }));

    res.json({
      posts: postsWithLikeStatus,
      hasMore: page * pageSize < total,
      total
    });
  } catch (error) {
    console.error('获取用户帖子失败:', error);
    res.status(500).json({ message: '获取失败' });
  }
});

// 获取用户收藏
router.get('/:id/collections', async (req, res) => {
  try {
    const user = await findUserByIdOrUsername(req.params.id);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    await user.populate({
      path: 'collections',
      match: { status: 'published' },
      populate: { path: 'author', select: 'nickname avatar' }
    });

    const collections = (user.collections || []).map(post => ({
      ...post.toObject(),
      id: post._id,
      type: 'post',
      typeText: '帖子',
      collectTime: post.createdAt
    }));

    res.json({
      success: true,
      data: collections,
      hasMore: false
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ message: '获取失败' });
  }
});

// 获取关注列表
router.get('/:id/following', async (req, res) => {
  try {
    const user = await findUserByIdOrUsername(req.params.id);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    await user.populate('following', 'nickname avatar bio college');

    const following = (user.following || []).map(u => ({
      ...u.toObject(),
      id: u._id,
      isFollowing: true
    }));

    res.json(following);
  } catch (error) {
    console.error('获取关注列表失败:', error);
    res.status(500).json({ message: '获取失败' });
  }
});

// 获取粉丝列表
router.get('/:id/followers', async (req, res) => {
  try {
    const user = await findUserByIdOrUsername(req.params.id);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    let currentUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
        currentUserId = decoded.userId;
      } catch (e) {}
    }

    await user.populate('followers', 'nickname avatar bio college');

    let currentUserFollowing = [];
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      currentUserFollowing = currentUser?.following.map(id => id.toString()) || [];
    }

    const followers = (user.followers || []).map(u => ({
      ...u.toObject(),
      id: u._id,
      isFollowing: currentUserFollowing.includes(u._id.toString())
    }));

    res.json(followers);
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    res.status(500).json({ message: '获取失败' });
  }
});

module.exports = router;