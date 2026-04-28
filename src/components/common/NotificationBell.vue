<template>
  <div class="notification-bell" @click="goToMessages">
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
      <el-icon :size="24" class="bell-icon"><Bell /></el-icon>
    </el-badge>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Bell } from '@element-plus/icons-vue'
import { io } from 'socket.io-client'
import API from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const unreadCount = ref(0)
const socket = ref(null)

const goToMessages = () => {
  router.push('/messages')
}

// 获取后端真实未读数量
const fetchUnreadCount = async () => {
  if (!userInfo.value) return
  try {
    const res = await API.get('/messages/unread-count')
    unreadCount.value = res.data.count
  } catch (error) {
    console.error('获取未读消息数失败', error)
  }
}

onMounted(() => {
  if (!userInfo.value) return
  
  fetchUnreadCount()

  // 建立独立连接监听全局红点通知
  socket.value = io('http://localhost:3000')
  socket.value.on('connect', () => {
    socket.value.emit('join_global', userInfo.value._id)
  })

  // 只要别人给我发了消息，未读数就自动加 1
  socket.value.on('new_unread_message', () => {
    unreadCount.value += 1
  })
})

onUnmounted(() => {
  if (socket.value) socket.value.disconnect()
})
</script>

<style scoped>
.notification-bell {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
}
.bell-icon {
  color: #606266;
  transition: color 0.3s;
}
.notification-bell:hover .bell-icon {
  color: #409eff;
}
</style>