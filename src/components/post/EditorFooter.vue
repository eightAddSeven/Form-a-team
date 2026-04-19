<template>
  <div class="editor-footer">
    <div class="footer-actions">
      <!-- 添加附件 -->
      <button class="action-btn" @click="handleAttach">
        <span>📎</span> 添加附件
      </button>
      <input 
        ref="fileInput"
        type="file" 
        multiple 
        style="display: none" 
        @change="handleFileChange"
      />
      
      <!-- 添加标签 -->
      <button class="action-btn" @click="showTagSelector = !showTagSelector">
        <span>🏷️</span> 添加标签
      </button>
      
      <!-- 分类选择 -->
      <select class="category-select" :value="category" @change="$emit('category-change', $event.target.value)">
        <option value="">选择分类</option>
        <option value="competition">学术竞赛</option>
        <option value="research">科研立项</option>
        <option value="experience">经验分享</option>
        <option value="question">求助问答</option>
        <option value="team">组队招募</option>
        <option value="other">其他</option>
      </select>
      
      <!-- 标签输入弹窗 -->
      <!-- 标签选择器面板 -->
      <div class="tag-selector-panel" v-if="showTagSelector">
        <div class="panel-header">
          <span>选择标签</span>
          <button @click="showTagSelector = false">✕</button>
        </div>
        <TagSelector v-model="selectedTags" @change="handleTagsChange" />
      </div>
    </div>
    
    <!-- 已上传的附件列表 -->
    <div class="attachments-list" v-if="attachments.length > 0">
      <div v-for="file in attachments" :key="file.id" class="attachment-item">
        <span class="attachment-icon">{{ getFileIcon(file.type) }}</span>
        <span class="attachment-name">{{ file.name }}</span>
        <span class="attachment-size">{{ formatFileSize(file.size) }}</span>
        <button class="remove-attachment" @click="removeAttachment(file.id)">✕</button>
        <div class="upload-progress" v-if="file.uploading">
          <div class="progress-bar" :style="{ width: file.progress + '%' }"></div>
        </div>
      </div>
    </div>
    
    <div class="footer-right">
      <span class="char-count" :class="{ warning: charCount > maxLength * 0.9 }">
        {{ charCount }}/{{ maxLength }}
      </span>
      <button class="submit-btn" @click="handleSubmit" :disabled="charCount > maxLength">
        <span>{{ submitText }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import TagSelector from './TagSelector.vue'

const showTagSelector = ref(false)
const selectedTags = ref([])

const props = defineProps({
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
  },
  submitText: {
    type: String,
    default: '发布帖子'
  }
})

const emit = defineEmits(['attach', 'tag', 'category-change', 'submit'])

// 附件相关
const fileInput = ref(null)
const attachments = ref([])

// 标签相关
const showTagInput = ref(false)
const newTag = ref('')
const tags = ref([])
const tagInput = ref(null)
const handleTagsChange = (tags) => {
  emit('tag', tags)
}

// 推荐标签
const suggestedTags = ref([
  '数学建模', '大创项目', '挑战杯', '互联网+',
  '经验分享', '求助', '组队', '讨论', '公告'
])

// 点击外部关闭指令
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

// 附件处理
const handleAttach = () => {
  fileInput.value?.click()
}

const handleFileChange = (event) => {
  const files = Array.from(event.target.files)
  
  files.forEach(file => {
    const fileId = Date.now() + Math.random()
    const attachment = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      uploading: true,
      progress: 0
    }
    
    attachments.value.push(attachment)
    
    // 模拟上传
    simulateUpload(fileId)
  })
  
  // 清空input
  event.target.value = ''
  
  emit('attach', attachments.value)
}

const simulateUpload = (fileId) => {
  const attachment = attachments.value.find(a => a.id === fileId)
  if (!attachment) return
  
  const interval = setInterval(() => {
    attachment.progress += 10
    
    if (attachment.progress >= 100) {
      clearInterval(interval)
      attachment.uploading = false
      ElMessage.success(`文件 ${attachment.name} 上传成功`)
    }
  }, 200)
}

const removeAttachment = (fileId) => {
  attachments.value = attachments.value.filter(a => a.id !== fileId)
  emit('attach', attachments.value)
}

const getFileIcon = (type) => {
  if (type.startsWith('image/')) return '🖼️'
  if (type.startsWith('video/')) return '🎬'
  if (type.startsWith('audio/')) return '🎵'
  if (type.includes('pdf')) return '📄'
  if (type.includes('word')) return '📝'
  if (type.includes('excel') || type.includes('sheet')) return '📊'
  if (type.includes('powerpoint') || type.includes('presentation')) return '📽️'
  if (type.includes('zip') || type.includes('rar')) return '📦'
  return '📎'
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 标签处理
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !tags.value.includes(tag)) {
    if (tags.value.length >= 5) {
      ElMessage.warning('最多只能添加5个标签')
      return
    }
    tags.value.push(tag)
    emit('tag', tags.value)
  }
  newTag.value = ''
}

const addSuggestedTag = (tag) => {
  if (!tags.value.includes(tag)) {
    if (tags.value.length >= 5) {
      ElMessage.warning('最多只能添加5个标签')
      return
    }
    tags.value.push(tag)
    emit('tag', tags.value)
  }
}

const removeTag = (tag) => {
  tags.value = tags.value.filter(t => t !== tag)
  emit('tag', tags.value)
}

const closeTagInput = () => {
  showTagInput.value = false
  newTag.value = ''
}

// 自动聚焦标签输入框
watch(showTagInput, (val) => {
  if (val) {
    nextTick(() => {
      tagInput.value?.focus()
    })
  }
})

// 提交
const handleSubmit = () => {
  if (props.charCount > props.maxLength) {
    ElMessage.warning(`内容超出最大长度 ${props.maxLength} 字符`)
    return
  }
  emit('submit')
}
</script>

<style scoped>
.editor-footer {
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  background: #fafbfc;
  border-top: 1px solid #e2e8f0;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
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

/* 标签输入弹窗 */
.tag-input-modal {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e8ecf0;
  z-index: 1000;
  width: 350px;
}

.tag-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #edf1f7;
}

.tag-input-header span {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 50%;
}

.close-btn:hover {
  background: #f1f5f9;
}

.tag-input-body {
  padding: 16px;
}

.tag-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  margin-bottom: 12px;
}

.tag-input:focus {
  border-color: #004e9e;
}

.suggested-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.suggested-label {
  font-size: 12px;
  color: #94a3b8;
}

.suggested-tag {
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 16px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.suggested-tag:hover {
  background: #004e9e;
  color: white;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #edf1f7;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #e8f0fe;
  border-radius: 16px;
  font-size: 12px;
  color: #004e9e;
}

.remove-tag {
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: #004e9e;
  font-size: 12px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-tag:hover {
  background: rgba(0, 78, 158, 0.2);
}

/* 附件列表 */
.attachments-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  position: relative;
}

.attachment-icon {
  font-size: 18px;
}

.attachment-name {
  flex: 1;
  font-size: 13px;
  color: #1e293b;
}

.attachment-size {
  font-size: 12px;
  color: #94a3b8;
}

.remove-attachment {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  border-radius: 50%;
}

.remove-attachment:hover {
  background: #fee2e2;
  color: #ef4444;
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #e2e8f0;
}

.progress-bar {
  height: 100%;
  background: #004e9e;
  transition: width 0.3s;
}

.footer-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 12px;
}

.char-count {
  font-size: 13px;
  color: #94a3b8;
}

.char-count.warning {
  color: #f59e0b;
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

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 78, 158, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>