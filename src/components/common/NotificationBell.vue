<template>
  <div class="notification-bell" @click="handleClick">
    <span class="bell-icon">🔔</span>
    <span class="badge" v-if="unreadCount > 0">
      {{ unreadCount > 99 ? '99+' : unreadCount }}
    </span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const unreadCount = ref(5)

const handleClick = () => {
  console.log('打开通知')
  // 可以添加路由跳转
}
</script>

<style scoped>
.notification-bell {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.notification-bell:hover {
  background-color: #f0f3f8;
}

.bell-icon {
  font-size: 20px;
}

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: #f23d4d;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 12px;
  min-width: 18px;
  text-align: center;
  border: 1.5px solid white;
}
</style>