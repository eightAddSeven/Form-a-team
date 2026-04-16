<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <AppHeader @publish="showPublishModal = true" />
    
    <!-- 主内容区域 -->
    <main class="app-main">
      <router-view />
    </main>
    
    <!-- 底部页脚 -->
    <AppFooter />
    
    <!-- 发布弹窗 -->
    <PublishModal v-model="showPublishModal" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import PublishModal from '@/components/post/PublishModal.vue'

const showPublishModal = ref(false)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: #f5f7fa;
  color: #222222;
  line-height: 1.5;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
}
</style>