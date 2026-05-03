const express = require('express');
const router = express.Router();
const Keyword = require('../models/Keyword');
const { auth, adminAuth } = require('../middleware/auth');

// 获取所有敏感词（管理员）
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const keywords = await Keyword.find().sort({ createdAt: -1 }).lean();
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ message: '获取敏感词失败' });
  }
});

// 添加敏感词（管理员）
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { word } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ message: '敏感词不能为空' });
    }
    const keyword = new Keyword({ word: word.trim() });
    await keyword.save();
    res.status(201).json(keyword);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '该敏感词已存在' });
    }
    res.status(500).json({ message: '添加失败' });
  }
});

// 删除敏感词（管理员）
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    await Keyword.findByIdAndDelete(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
  }
});

module.exports = router;