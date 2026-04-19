<template>
  <div class="user-dropdown" @click="toggleDropdown">
    <img :src="userAvatar" alt="avatar" class="avatar" />
    <span class="username">{{ displayName }}</span>
    <span class="arrow">▼</span>
    
    <div class="dropdown-menu" v-show="showDropdown" @click.stop>
      <div class="menu-item" @click="goToProfile">
        <span>👤</span> 个人中心
      </div>
      <div class="menu-item" @click="goToMessages">
        <span>💬</span> 我的消息
      </div>
      <div class="menu-item" @click="goToSettings">
        <span>⚙️</span> 设置
      </div>
      <div class="divider"></div>
      <div class="menu-item" @click="handleLogout">
        <span>🚪</span> 退出登录
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const showDropdown = ref(false)

const userAvatar = computed(() => 
  userStore.userInfo?.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23e2e8f0\'/%3E%3Ccircle cx=\'20\' cy=\'15\' r=\'7\' fill=\'%2394a3b8\'/%3E%3Cpath d=\'M8 32 Q20 24, 32 32\' fill=\'%2394a3b8\'/%3E%3C/svg%3E'
)

const displayName = computed(() => 
  userStore.userInfo?.nickname || userStore.userInfo?.username || '游客'
)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const goToProfile = () => {
  showDropdown.value = false
  router.push('/profile')
}

const goToMessages = () => {
  showDropdown.value = false
  router.push('/messages')
}

const goToSettings = () => {
  showDropdown.value = false
  ElMessage.info('设置功能开发中...')
}

const handleLogout = () => {
  showDropdown.value = false
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>

<style scoped>
.user-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 12px 4px 8px;
  border-radius: 30px;
  background-color: #f7f9fc;
  border: 1px solid #e2e8f0;
  transition: background 0.2s;
}

.user-dropdown:hover {
  background-color: #eef2f6;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.arrow {
  font-size: 10px;
  color: #8c95a5;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e8ecf0;
  min-width: 160px;
  z-index: 1000;
  padding: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
  color: #1e293b;
}

.menu-item:hover {
  background: #f1f5f9;
}

.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 8px 0;
}
</style>