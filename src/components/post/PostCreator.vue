<template>
  <div class="post-creator">
    <div class="creator-header">
      <UserAvatar :size="48" :src="userAvatar" />
      <div class="creator-title">
        <h3>{{ isLoggedIn ? '分享你的想法...' : '登录后即可发布内容' }}</h3>
        <span class="creator-tip">支持 Markdown 格式，Ctrl+B 加粗，Ctrl+I 斜体</span>
      </div>
    </div>
    
    <!-- 未登录时显示登录提示 -->
    <div v-if="!isLoggedIn" class="login-tip">
      <p>登录后即可发布帖子、参与讨论</p>
      <div class="login-actions">
        <button class="tip-login-btn" @click="goToLogin">立即登录</button>
        <button class="tip-register-btn" @click="goToRegister">注册账号</button>
      </div>
    </div>
    
    <!-- 已登录时显示编辑器 -->
    <div v-else class="editor-wrapper">
      <!-- 标题输入 -->
      <input 
        type="text" 
        v-model="title"
        placeholder="请输入标题（可选）"
        class="title-input"
        maxlength="100"
      />
      
      <EditorToolbar @insert="handleInsert" @format="handleFormat" />
      
      <textarea 
        class="content-textarea" 
        :placeholder="placeholder"
        v-model="content"
        :maxlength="maxLength"
        @input="handleInput"
        @keydown="handleKeydown"
        ref="textareaRef"
      ></textarea>
      
      <!-- 预览区域 -->
      <div class="preview-section" v-if="showPreview">
        <div class="preview-header">
          <span>预览</span>
          <button @click="showPreview = false" class="close-preview">✕</button>
        </div>
        <div class="preview-content" v-html="renderedContent"></div>
      </div>
      
      <EditorFooter 
        :char-count="content.length"
        :max-length="maxLength"
        :category="category"
        :submit-text="isEditing ? '更新帖子' : '发布帖子'"
        @attach="handleAttach"
        @tag="handleTags"
        @category-change="category = $event"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EditorToolbar from './EditorToolbar.vue'
import EditorFooter from './EditorFooter.vue'

const router = useRouter()
const userStore = useUserStore()

const props = defineProps({
  placeholder: {
    type: String,
    default: `请输入内容...

你可以：
• 分享竞赛经验
• 寻求组队队友
• 讨论科研项目
• 发布学术动态`
  },
  maxLength: {
    type: Number,
    default: 2000
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  initialContent: {
    type: String,
    default: ''
  },
  initialTitle: {
    type: String,
    default: ''
  },
  // ✅ 新增：接收标签、分类和附件的旧数据
  initialCategory: {
    type: String,
    default: ''
  },
  initialTags: {
    type: Array,
    default: () => []
  },
  initialAttachments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit', 'input', 'attach', 'tag', 'cancel'])

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userAvatar = computed(() => userStore.userInfo?.avatar || '')

// ✅ 确保状态初始化时继承旧数据
const title = ref(props.initialTitle)
const content = ref(props.initialContent)
const category = ref(props.initialCategory)
const attachments = ref(props.initialAttachments)
const tags = ref(props.initialTags)
const showPreview = ref(false)
const textareaRef = ref(null)

// 渲染Markdown
const renderedContent = computed(() => {
  return marked(content.value || '暂无内容')
})

const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}

const handleInput = () => {
  emit('input', content.value)
}

// 处理插入操作
const handleInsert = (action) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)
  
  let insertText = ''
  let cursorOffset = 0
  
  switch (action.type) {
    case 'format':
      insertText = action.marker + selectedText + action.marker
      cursorOffset = action.marker.length
      break
      
    case 'heading':
      insertText = action.prefix + selectedText
      break
      
    case 'list':
      const lines = selectedText.split('\n')
      insertText = lines.map(line => action.prefix + line).join('\n')
      break
      
    case 'quote':
      insertText = action.prefix + selectedText
      break
      
    case 'code':
      insertText = action.prefix + (selectedText || '代码') + action.suffix
      break
      
    case 'link':
      insertText = `[${action.text}](${action.url})`
      break
      
    case 'image':
      insertText = `![${action.alt}](${action.url})`
      break
      
    case 'mention':
      insertText = action.text + ' '
      break
      
    case 'topic':
      insertText = action.text + ' '
      break
      
    case 'text':
      insertText = action.text
      break
  }
  
  content.value = content.value.substring(0, start) + insertText + content.value.substring(end)
  
  nextTick(() => {
    const newPosition = start + insertText.length - (action.type === 'format' ? cursorOffset : 0)
    textarea.setSelectionRange(newPosition, newPosition)
    textarea.focus()
  })
}

const handleFormat = (format) => {
  console.log('格式变化:', format)
}

const handleKeydown = (e) => {
  // Tab键插入空格
  if (e.key === 'Tab') {
    e.preventDefault()
    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    content.value = content.value.substring(0, start) + '  ' + content.value.substring(end)
    
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2
    })
  }
}

const handleAttach = (files) => {
  attachments.value = files
  emit('attach', files)
}

const handleTags = (newTags) => {
  tags.value = newTags
  emit('tag', newTags)
}

const handleSubmit = () => {
  if (!content.value.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }
  
  emit('submit', {
    title: title.value,
    content: content.value,
    category: category.value,
    attachments: attachments.value,
    tags: tags.value
  })
  
  // 清空表单
  if (!props.isEditing) {
    title.value = ''
    content.value = ''
    category.value = ''
    attachments.value = []
    tags.value = []
  }
}
</script>

<style scoped>
.post-creator {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf1f7;
}

.creator-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.creator-title h3 {
  font-size: 18px;
  color: #1e293b;
  margin-bottom: 4px;
}

.creator-tip {
  font-size: 13px;
  color: #94a3b8;
}

.login-tip {
  padding: 40px 20px;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
}

.login-tip p {
  color: #64748b;
  margin-bottom: 20px;
  font-size: 15px;
}

.login-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.tip-login-btn,
.tip-register-btn {
  padding: 10px 24px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tip-login-btn {
  background: #004e9e;
  border: none;
  color: white;
}

.tip-login-btn:hover {
  background: #0066cc;
}

.tip-register-btn {
  background: white;
  border: 1px solid #004e9e;
  color: #004e9e;
}

.tip-register-btn:hover {
  background: #e8f0fe;
}

.editor-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.editor-wrapper:focus-within {
  border-color: #004e9e;
  box-shadow: 0 0 0 3px rgba(0, 78, 158, 0.1);
}

.title-input {
  width: 100%;
  border: none;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
  outline: none;
}

.title-input::placeholder {
  font-weight: 400;
  color: #94a3b8;
}

.content-textarea {
  width: 100%;
  border: none;
  padding: 20px;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
  outline: none;
  min-height: 150px;
}

.content-textarea::placeholder {
  color: #94a3b8;
}

.preview-section {
  border-top: 1px solid #e2e8f0;
  background: #fafbfc;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.preview-header span {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.close-preview {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 50%;
}

.close-preview:hover {
  background: #f1f5f9;
}

.preview-content {
  padding: 20px;
  font-size: 15px;
  line-height: 1.6;
  color: #1e293b;
  max-height: 300px;
  overflow-y: auto;
}
</style>