<template>
  <header class="app-header">
    <div class="header-container">
      <!-- 左侧 Logo + 城市 -->
      <div class="header-left">
        <div class="logo-wrapper">
          <CUGLogo />
        </div>
        <CitySelector />
      </div>

      <!-- 中间导航菜单 -->
      <nav class="header-nav">
        <router-link to="/" class="nav-item" exact-active-class="active">
          首页
        </router-link>
        
        <!-- 学术竞赛下拉 -->
        <CompetitionDropdown />
        
        <!-- 科研立项下拉 -->
        <ResearchDropdown />
      </nav>

      <!-- 右侧功能区 -->
      <div class="header-right">
        <NotificationBell />
        <PublishButton @click="$emit('publish')" />
        <UserDropdown />
      </div>
    </div>
  </header>
</template>

<script setup>
import CUGLogo from '@/assets/CUGLogo.vue'
import CitySelector from '@/components/common/CitySelector.vue'
import NotificationBell from '@/components/common/NotificationBell.vue'
import PublishButton from '@/components/common/PublishButton.vue'
import UserDropdown from '@/components/common/UserDropdown.vue'
import CompetitionDropdown from '@/components/navigation/CompetitionDropdown.vue'
import ResearchDropdown from '@/components/navigation/ResearchDropdown.vue'

defineEmits(['publish'])
</script>

<style scoped>
.app-header {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #e8ecf0;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-wrapper {
  display: flex;
  align-items: center;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-left: 40px;
  flex: 1;
}

.nav-item {
  text-decoration: none;
  color: #3c4a5a;
  font-size: 16px;
  font-weight: 500;
  padding: 8px 0;
  position: relative;
  transition: color 0.2s;
}

.nav-item:hover {
  color: #004e9e;
}

.nav-item.active {
  color: #004e9e;
  font-weight: 600;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #004e9e;
  border-radius: 3px 3px 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>