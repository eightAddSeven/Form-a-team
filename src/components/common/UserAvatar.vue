<template>
  <div class="user-avatar" :style="{ width: size + 'px', height: size + 'px' }">
    <img :src="fullAvatarUrl" :alt="alt" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: 'avatar'
  },
  size: {
    type: Number,
    default: 40
  }
})

const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e2e8f0'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%2394a3b8'/%3E%3Cpath d='M8 32 Q20 24, 32 32' fill='%2394a3b8'/%3E%3C/svg%3E"

// 自动拼接后端服务器地址，如果是外链或 base64 则保持原样
const fullAvatarUrl = computed(() => {
  if (!props.src) return defaultAvatar
  if (props.src.startsWith('http') || props.src.startsWith('data:')) {
    return props.src
  }
  const baseURL = 'http://localhost:3000'
  return `${baseURL}${props.src.startsWith('/') ? '' : '/'}${props.src}`
})
</script>

<style scoped>
.user-avatar {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex; /* 确保 img 不会由于空白符下沉 */
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

<style scoped>
.user-avatar {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>