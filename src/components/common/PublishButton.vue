<template>
  <button class="publish-btn" @click="handleClick">
    <span class="publish-icon">✏️</span>
    <span>发布</span>
  </button>
</template>

<script setup>
const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click')
  console.log('打开发布')
}
</script>

<style scoped>
.publish-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #004e9e 0%, #0066cc 100%);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 78, 158, 0.2);
}

.publish-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 78, 158, 0.3);
}

.publish-icon {
  font-size: 16px;
}
</style>