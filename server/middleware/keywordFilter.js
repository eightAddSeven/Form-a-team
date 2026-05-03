const Keyword = require('../models/Keyword');

// 缓存敏感词列表，每分钟刷新一次
let cachedKeywords = [];
let lastUpdateTime = 0;
const CACHE_TTL = 60000; // 1分钟

const loadKeywords = async () => {
  const now = Date.now();
  if (now - lastUpdateTime > CACHE_TTL) {
    const keywords = await Keyword.find().lean();
    cachedKeywords = keywords.map(k => k.word.toLowerCase());
    lastUpdateTime = now;
  }
  return cachedKeywords;
};

const keywordFilter = async (req, res, next) => {
  try {
    const content = req.body.content || req.body.text || '';
    const keywords = await loadKeywords();
    for (let word of keywords) {
      if (content.toLowerCase().includes(word)) {
        return res.status(400).json({ message: `内容包含敏感词，请修改后重新提交` });
      }
    }
    next();
  } catch (error) {
    console.error('敏感词检测失败:', error);
    res.status(500).json({ message: '内容审核失败' });
  }
};

module.exports = keywordFilter;