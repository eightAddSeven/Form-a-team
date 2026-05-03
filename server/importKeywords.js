// server/importKeywords.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ⚠️ 请将下面的路径替换为你实测正确的 Vocabulary 文件夹路径
const VOCABULARY_PATH = 'D:\\软工基础上机\\敏感词\\Sensitive-lexicon-main\\Sensitive-lexicon-main\\Vocabulary';

console.log('📌 脚本开始执行...');
console.log('📂 目标路径:', VOCABULARY_PATH);

// 检查路径是否存在
if (!fs.existsSync(VOCABULARY_PATH)) {
  console.error('❌ 路径不存在，请检查 VOCABULARY_PATH 是否正确');
  process.exit(1);
}
console.log('✅ 路径存在');

// 连接数据库
console.log('⏳ 正在连接数据库...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ 数据库连接成功');
    startImport();
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  });

const Keyword = require('./models/Keyword');

// 要导入的文件列表
const FILES_TO_IMPORT = [
  '广告类型.txt',
  '其他词库.txt',
  '暴恐词库.txt',
  '色情词库.txt',
];

let totalAdded = 0;
let totalSkipped = 0;

async function startImport() {
  console.log('\n========================================');
  console.log('🚀 开始导入敏感词...\n');

  for (const fileName of FILES_TO_IMPORT) {
    const filePath = path.join(VOCABULARY_PATH, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 文件不存在，跳过: ${fileName}`);
      continue;
    }

    let content;
    try {
      // 尝试以 utf-8 读取，如果失败则用 gb2312 再试
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        content = fs.readFileSync(filePath, 'gb2312');
      }
    } catch (readError) {
      console.log(`❌ 读取文件失败: ${fileName}`, readError.message);
      continue;
    }

    // 按换行和空格分割
    const words = content
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .split(' ')
      .map(w => w.trim())
      .filter(w => w.length > 0);

    console.log(`📄 ${fileName} (共 ${words.length} 个词汇)`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const word of words) {
      try {
        const keyword = new Keyword({ word });
        await keyword.save();
        addedCount++;
        totalAdded++;
      } catch (error) {
        if (error.code === 11000) {
          skippedCount++;
          totalSkipped++;
        }
        // 其他错误暂时不计数，继续导入
      }
    }

    console.log(`   ✅ 新增: ${addedCount}  |  ⏭️ 跳过（重复）: ${skippedCount}`);
  }

  console.log('\n========================================');
  console.log(`🎉 导入完成！总计新增: ${totalAdded}，总计跳过: ${totalSkipped}`);
  process.exit(0);
}