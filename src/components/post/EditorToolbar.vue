<template>
  <div class="editor-toolbar">
    <!-- 文本格式 -->
    <button 
      class="tool-btn" 
      @click="insertFormat('bold')" 
      title="粗体 (Ctrl+B)"
      :class="{ active: formats.bold }"
    >
      <strong>B</strong>
    </button>
    <button 
      class="tool-btn" 
      @click="insertFormat('italic')" 
      title="斜体 (Ctrl+I)"
      :class="{ active: formats.italic }"
    >
      <em>I</em>
    </button>
    <button 
      class="tool-btn" 
      @click="insertFormat('underline')" 
      title="下划线 (Ctrl+U)"
      :class="{ active: formats.underline }"
    >
      <u>U</u>
    </button>
    <button 
      class="tool-btn" 
      @click="insertFormat('strikethrough')" 
      title="删除线"
      :class="{ active: formats.strikethrough }"
    >
      <del>S</del>
    </button>
    
    <span class="toolbar-divider"></span>
    
    <!-- 标题 -->
    <select class="heading-select" v-model="headingLevel" @change="setHeading">
      <option value="">正文</option>
      <option value="h1">标题1</option>
      <option value="h2">标题2</option>
      <option value="h3">标题3</option>
      <option value="h4">标题4</option>
    </select>
    
    <span class="toolbar-divider"></span>
    
    <!-- 列表和引用 -->
    <button class="tool-btn" @click="insertList('ul')" title="无序列表">
      <span>•</span> 列表
    </button>
    <button class="tool-btn" @click="insertList('ol')" title="有序列表">
      <span>1.</span> 列表
    </button>
    <button class="tool-btn" @click="insertQuote" title="引用">
      <span>❝</span>
    </button>
    <button class="tool-btn" @click="insertCode" title="代码块">
      <span>{ }</span>
    </button>
    
    <span class="toolbar-divider"></span>
    
    <!-- 链接和图片 -->
    <button class="tool-btn" @click="insertLink" title="插入链接">
      <span>🔗</span>
    </button>
    <button class="tool-btn" @click="insertImage" title="插入图片">
      <span>🖼️</span>
    </button>
    
    <span class="toolbar-divider"></span>
    
    <!-- 特殊插入 -->
    <button class="tool-btn" @click="showEmojiPicker = !showEmojiPicker" title="表情">
      <span>😊</span>
    </button>
    <button class="tool-btn" @click="insertMention" title="@用户">
      <span>@</span>
    </button>
    <button class="tool-btn" @click="insertTopic" title="话题">
      <span>#</span>
    </button>
    
    <!-- 表情选择器 -->
    <div class="emoji-picker" v-if="showEmojiPicker" v-click-outside="closeEmojiPicker">
      <div class="emoji-header">
        <span>常用表情</span>
        <button class="close-emoji" @click="showEmojiPicker = false">✕</button>
      </div>
      <div class="emoji-list">
        <span 
          v-for="emoji in commonEmojis" 
          :key="emoji"
          @click="insertEmoji(emoji)"
          class="emoji-item"
        >
          {{ emoji }}
        </span>
      </div>
    </div>
    
    <!-- @用户弹窗 -->
    <div class="mention-picker" v-if="showMentionPicker" v-click-outside="closeMentionPicker">
      <input 
        type="text" 
        v-model="mentionSearch" 
        placeholder="搜索用户..."
        class="mention-search"
        @keyup.enter="selectFirstUser"
      />
      <div class="mention-list">
        <div 
          v-for="user in filteredUsers" 
          :key="user.id"
          @click="selectUser(user)"
          class="mention-item"
        >
          <img :src="user.avatar" alt="avatar" class="mention-avatar" />
          <div class="mention-info">
            <span class="mention-name">{{ user.nickname }}</span>
            <span class="mention-username">@{{ user.username }}</span>
          </div>
        </div>
        <div v-if="filteredUsers.length === 0" class="mention-empty">
          暂无匹配用户
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const emit = defineEmits(['action', 'insert', 'format'])

// 格式状态
const formats = reactive({
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false
})

// 标题级别
const headingLevel = ref('')

// 表情选择器
const showEmojiPicker = ref(false)
const commonEmojis = ref([
  '😊', '😂', '🤣', '❤️', '👍', '🙏', '😭', '😍', 
  '🎉', '✨', '🔥', '💯', '⭐', '📝', '💡', '🤔',
  '😅', '😘', '🥰', '😎', '🤓', '🧐', '🤯', '😱'
])

// @用户选择器
const showMentionPicker = ref(false)
const mentionSearch = ref('')
const recentUsers = ref([
  { id: 1, username: 'zhangsan', nickname: '张三', avatar: '' },
  { id: 2, username: 'lisi', nickname: '李四', avatar: '' },
  { id: 3, username: 'wangwu', nickname: '王五', avatar: '' },
  { id: 4, username: 'zhaoliu', nickname: '赵六', avatar: '' }
])

const filteredUsers = computed(() => {
  if (!mentionSearch.value) return recentUsers.value
  return recentUsers.value.filter(user => 
    user.nickname.includes(mentionSearch.value) || 
    user.username.includes(mentionSearch.value)
  )
})

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

// 文本格式化
const insertFormat = (format) => {
  formats[format] = !formats[format]
  
  const formatMap = {
    bold: '**',
    italic: '*',
    underline: '__',
    strikethrough: '~~'
  }
  
  const marker = formatMap[format]
  if (marker) {
    emit('insert', { type: 'format', format, marker })
  }
}

// 设置标题
const setHeading = () => {
  if (headingLevel.value) {
    const level = headingLevel.value.charAt(1)
    const prefix = '#'.repeat(level) + ' '
    emit('insert', { type: 'heading', level, prefix })
    headingLevel.value = ''
  }
}

// 插入列表
const insertList = (type) => {
  const prefix = type === 'ul' ? '- ' : '1. '
  emit('insert', { type: 'list', listType: type, prefix })
}

// 插入引用
const insertQuote = () => {
  emit('insert', { type: 'quote', prefix: '> ' })
}

// 插入代码块
const insertCode = () => {
  ElMessageBox.prompt('请输入语言类型（可选）', '插入代码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: 'javascript / python / html ...'
  }).then(({ value }) => {
    const lang = value || ''
    emit('insert', { 
      type: 'code', 
      prefix: '```' + lang + '\n',
      suffix: '\n```'
    })
  }).catch(() => {})
}

// 插入链接
const insertLink = () => {
  ElMessageBox.prompt('请输入链接地址', '插入链接', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: 'https://example.com',
    inputPattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    inputErrorMessage: '请输入有效的URL'
  }).then(({ value }) => {
    let url = value
    if (!url.startsWith('http')) {
      url = 'https://' + url
    }
    
    ElMessageBox.prompt('请输入链接文本', '链接文本', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '链接文本'
    }).then(({ value: text }) => {
      emit('insert', { 
        type: 'link', 
        text: text || url,
        url 
      })
    }).catch(() => {
      emit('insert', { type: 'link', text: url, url })
    })
  }).catch(() => {})
}

// 插入图片
const insertImage = () => {
  ElMessageBox.prompt('请输入图片地址', '插入图片', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: 'https://example.com/image.jpg'
  }).then(({ value }) => {
    ElMessageBox.prompt('请输入图片描述（可选）', '图片描述', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '图片描述'
    }).then(({ value: alt }) => {
      emit('insert', { type: 'image', url: value, alt: alt || '图片' })
    }).catch(() => {
      emit('insert', { type: 'image', url: value, alt: '图片' })
    })
  }).catch(() => {})
}

// 插入表情
const insertEmoji = (emoji) => {
  emit('insert', { type: 'text', text: emoji })
  showEmojiPicker.value = false
}

const closeEmojiPicker = () => {
  showEmojiPicker.value = false
}

// @用户
const insertMention = () => {
  showMentionPicker.value = true
  mentionSearch.value = ''
}

const selectUser = (user) => {
  emit('insert', { type: 'mention', user, text: `@${user.nickname}` })
  showMentionPicker.value = false
  
  // 更新最近使用
  if (!recentUsers.value.find(u => u.id === user.id)) {
    recentUsers.value.unshift(user)
  }
}

const selectFirstUser = () => {
  if (filteredUsers.value.length > 0) {
    selectUser(filteredUsers.value[0])
  }
}

const closeMentionPicker = () => {
  showMentionPicker.value = false
}

// 插入话题
const insertTopic = () => {
  ElMessageBox.prompt('请输入话题名称', '插入话题', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '例如：数学建模'
  }).then(({ value }) => {
    emit('insert', { type: 'topic', text: `#${value}#` })
  }).catch(() => {})
}

// 键盘快捷键
const handleKeydown = (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'b':
        e.preventDefault()
        insertFormat('bold')
        break
      case 'i':
        e.preventDefault()
        insertFormat('italic')
        break
      case 'u':
        e.preventDefault()
        insertFormat('underline')
        break
      case 'k':
        e.preventDefault()
        insertLink()
        break
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  position: relative;
}

.tool-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-btn:hover {
  background: #e8f0fe;
  color: #004e9e;
}

.tool-btn.active {
  background: #004e9e;
  color: white;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
  margin: 0 8px;
}

.heading-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
  background: white;
  cursor: pointer;
  outline: none;
  height: 32px;
}

.heading-select:hover {
  border-color: #004e9e;
}

/* 表情选择器 */
.emoji-picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e8ecf0;
  z-index: 1000;
  width: 300px;
}

.emoji-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #edf1f7;
}

.emoji-header span {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.close-emoji {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 50%;
}

.close-emoji:hover {
  background: #f1f5f9;
}

.emoji-list {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-item {
  font-size: 24px;
  padding: 4px;
  cursor: pointer;
  text-align: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.emoji-item:hover {
  background: #f1f5f9;
}

/* @用户选择器 */
.mention-picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e8ecf0;
  z-index: 1000;
  width: 280px;
}

.mention-search {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid #edf1f7;
  font-size: 14px;
  outline: none;
  border-radius: 12px 12px 0 0;
}

.mention-list {
  max-height: 300px;
  overflow-y: auto;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.mention-item:hover {
  background: #f8fafc;
}

.mention-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.mention-info {
  display: flex;
  flex-direction: column;
}

.mention-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.mention-username {
  font-size: 12px;
  color: #94a3b8;
}

.mention-empty {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}
</style>