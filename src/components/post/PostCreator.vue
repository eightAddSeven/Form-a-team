<template>
  <div class="post-creator">
    <div class="creator-header">
      <UserAvatar :size="48" />
      <div class="creator-title">
        <h3>分享你的想法...</h3>
        <span class="creator-tip">支持 Markdown 格式</span>
      </div>
    </div>
    
    <!-- 编辑器 -->
    <div class="editor-wrapper">
      <EditorToolbar @action="handleToolbarAction" />
      
      <textarea 
        class="content-textarea" 
        :placeholder="placeholder"
        v-model="content"
        :maxlength="maxLength"
        @input="handleInput"
        ref="textareaRef"
      ></textarea>
      
      <EditorFooter 
        :char-count="content.length"
        :max-length="maxLength"
        :category="category"
        @attach="handleAttach"
        @tag="handleAddTag"
        @category-change="category = $event"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import EditorToolbar from './EditorToolbar.vue'
import EditorFooter from './EditorFooter.vue'

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
  }
})

const emit = defineEmits(['submit', 'input', 'attach', 'tag'])

const content = ref('')
const category = ref('')
const textareaRef = ref(null)

const handleInput = () => {
  emit('input', content.value)
}

const handleToolbarAction = (action) => {
  // 处理工具栏操作（粗体、斜体等）
  console.log('工具栏操作:', action)
}

const handleAttach = () => {
  emit('attach')
}

const handleAddTag = () => {
  emit('tag')
}

const handleSubmit = () => {
  if (content.value.trim()) {
    emit('submit', {
      content: content.value,
      category: category.value
    })
    content.value = ''
    category.value = ''
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

.content-textarea {
  width: 100%;
  border: none;
  padding: 20px;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
  outline: none;
}

.content-textarea::placeholder {
  color: #94a3b8;
}
</style>