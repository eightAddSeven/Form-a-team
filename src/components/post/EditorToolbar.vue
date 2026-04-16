<template>
  <div class="editor-toolbar">
    <button class="tool-btn" @click="$emit('action', 'bold')" title="粗体">B</button>
    <button class="tool-btn" @click="$emit('action', 'italic')" title="斜体">I</button>
    <button class="tool-btn" @click="$emit('action', 'quote')" title="引用">❝</button>
    <button class="tool-btn" @click="$emit('action', 'code')" title="代码">{ }</button>
    <button class="tool-btn" @click="$emit('action', 'link')" title="链接">🔗</button>
    <button class="tool-btn" @click="$emit('action', 'image')" title="图片">🖼️</button>
    <span class="toolbar-divider"></span>
    <button class="tool-btn" @click="$emit('action', 'emoji')" title="表情">😊</button>
    <button class="tool-btn" @click="$emit('action', 'mention')" title="@用户">@</button>
    <button class="tool-btn" @click="$emit('action', 'topic')" title="话题">#</button>
  </div>
</template>

<script setup>
defineEmits(['action'])
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #e2e8f0;
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
}

.tool-btn:hover {
  background: #e8f0fe;
  color: #004e9e;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
  margin: 0 8px;
}
</style>