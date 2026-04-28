<template>
  <div class="notification-bell" @click="goToMessages">
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
      <el-icon :size="24" class="bell-icon"><Bell /></el-icon>
    </el-badge>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed, watch } from 'vue'
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
  try {
    const res = await API.get('/messages/unread-count')
    unreadCount.value = res.data.count
  } catch (error) {
    console.error('获取未读消息数失败', error)
  }
}

// ✅ 核心修复：使用 watch 代替 onMounted，解决刷新页面时状态未加载的问题
watch(() => userInfo.value, (newVal) => {
  if (newVal) {
    // 1. 兼容获取真实的 userId，防止出现 undefined
    const userId = newVal._id || newVal.id
    if (!userId) return

    // 2. 先去后端拉取一次当前的总未读数
    fetchUnreadCount()

    // 3. 建立全局独立连接，监听小红点推送（加锁防止重复连接）
    if (!socket.value) {
      socket.value = io('http://localhost:3000')
      
      socket.value.on('connect', () => {
        socket.value.emit('join_global', userId)
      })

      // 只要别人给我发了消息，不管我在哪个页面，未读数都自动 +1
      socket.value.on('new_unread_message', () => {
        unreadCount.value += 1
      })
    }
  } else {
    // 退出登录时的安全清理逻辑
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
    unreadCount.value = 0
  }
}, { immediate: true }) // immediate: true 保证组件一加载就立刻执行一次检查

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