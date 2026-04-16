<template>
  <div class="cug-logo-wrapper">
    <img 
      :src="logoUrl" 
      alt="中国地质大学校徽" 
      class="cug-logo"
      @error="handleImageError"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const logoUrl = ref('https://ts1.tc.mm.bing.net/th/id/OIP-C.u5aKLIARF92QVf6ardo-_wHaHa?w=193&h=193&c=8&rs=1&qlt=90&o=6&dpr=1.5&pid=3.1&rm=2')

// 如果图片加载失败，可以显示备用内容
const handleImageError = () => {
  console.warn('校徽图片加载失败，使用默认样式')
  // 可以在这里设置备用方案
}
</script>

<style scoped>
.cug-logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cug-logo {
  height: 40px;
  width: auto;
  max-width: 60px;
  object-fit: contain;
  cursor: pointer;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.cug-logo:hover {
  transform: scale(1.05);
}

/* 如果图片加载失败，可以添加一个备用背景 */
.cug-logo:not([src]), 
.cug-logo[src=""] {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #004e9e, #0066cc);
  color: white;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 8px;
}
</style>