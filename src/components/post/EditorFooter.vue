<template>
  <div class="editor-footer">
    <div class="footer-actions">
      <button class="action-btn" @click="$emit('attach')">
        <span>📎</span> 添加附件
      </button>
      <button class="action-btn" @click="$emit('tag')">
        <span>🏷️</span> 添加标签
      </button>
      <select class="category-select" :value="category" @change="$emit('category-change', $event.target.value)">
        <option value="">选择分类</option>
        <option value="competition">学术竞赛</option>
        <option value="research">科研立项</option>
        <option value="experience">经验分享</option>
        <option value="question">求助问答</option>
      </select>
    </div>
    <div class="footer-right">
      <span class="char-count">{{ charCount }}/{{ maxLength }}</span>
      <button class="submit-btn" @click="$emit('submit')">
        <span>发布帖子</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  charCount: {
    type: Number,
    default: 0
  },
  maxLength: {
    type: Number,
    default: 2000
  },
  category: {
    type: String,
    default: ''
  }
})

defineEmits(['attach', 'tag', 'category-change', 'submit'])
</script>

<style scoped>
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fafbfc;
  border-top: 1px solid #e2e8f0;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f8fafc;
  border-color: #004e9e;
  color: #004e9e;
}

.category-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  background: white;
  cursor: pointer;
  outline: none;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.char-count {
  font-size: 13px;
  color: #94a3b8;
}

.submit-btn {
  background: linear-gradient(135deg, #004e9e 0%, #0066cc 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 78, 158, 0.3);
}
</style>