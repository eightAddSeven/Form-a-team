<template>
  <header class="app-header">
    <div class="header-container">
      <!-- 左侧 Logo + 城市 -->
      <div class="header-left">
        <div class="logo-wrapper" @click="$router.push('/')">
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

      <!-- 中间搜索框 -->
      <div class="header-search">
        <div class="search-wrapper" :class="{ 'is-focused': isSearchFocused }">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            v-model="searchKeyword"
            placeholder="搜索帖子、竞赛、用户..."
            class="search-input"
            @focus="isSearchFocused = true"
            @blur="isSearchFocused = false"
            @keyup.enter="handleSearch"
            @input="handleSearchInput"
          />
          <button 
            v-if="searchKeyword" 
            class="clear-search-btn" 
            @click.stop="clearSearch"
          >
            ✕
          </button>
          <button class="search-btn" @click="handleSearch">
            搜索
          </button>
        </div>
        
        <!-- 搜索建议下拉 -->
        <div 
          class="search-suggestions" 
          v-show="showSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0)"
          @mousedown.prevent
        >
          <!-- 搜索历史 -->
          <div v-if="!searchKeyword && searchHistory.length > 0" class="suggestion-section">
            <div class="section-header">
              <span class="section-title">最近搜索</span>
              <button class="clear-history-btn" @click="clearSearchHistory">清空</button>
            </div>
            <div class="suggestion-list">
              <div 
                v-for="(item, index) in searchHistory" 
                :key="index"
                class="suggestion-item"
                @click="selectHistoryItem(item)"
              >
                <span class="history-icon">🕐</span>
                <span class="suggestion-text">{{ item }}</span>
              </div>
            </div>
          </div>
          
          <!-- 搜索建议 -->
          <div v-if="searchKeyword" class="suggestion-section">
            <div class="section-header">
              <span class="section-title">搜索结果</span>
            </div>
            <div class="suggestion-list">
              <div 
                v-for="suggestion in searchSuggestions" 
                :key="suggestion.id"
                class="suggestion-item"
                @click="selectSuggestion(suggestion)"
              >
                <span class="suggestion-icon">{{ getSuggestionIcon(suggestion.type) }}</span>
                <div class="suggestion-content">
                  <div class="suggestion-title">{{ suggestion.title }}</div>
                  <div class="suggestion-subtitle">{{ suggestion.subtitle }}</div>
                </div>
                <span class="suggestion-type">{{ suggestion.typeText }}</span>
              </div>
            </div>
          </div>
          
          <!-- 搜索按钮 -->
          <div class="suggestion-footer" v-if="searchKeyword">
            <button class="search-all-btn" @click="handleSearch">
              搜索 "{{ searchKeyword }}"
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧功能区 -->
      <div class="header-right">
        <NotificationBell @click="$router.push('/messages')" />
        <PublishButton @click="handlePublish" />
        
        <!-- 管理员入口与可爱标识 -->
        <template v-if="userStore.isLoggedIn && userStore.isAdmin">
          <router-link to="/admin" class="admin-link">
            🛠️ 管理后台
          </router-link>
          <span class="admin-crown" title="管理员">👑</span>
        </template>

        <!-- 根据登录状态显示不同内容 -->
        <template v-if="userStore.isLoggedIn">
          <UserDropdown />
        </template>
        <template v-else>
          <button class="login-btn" @click="$router.push('/login')">
            登录
          </button>
          <button class="register-btn" @click="$router.push('/register')">
            注册
          </button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import CUGLogo from '@/assets/CUGLogo.vue'
import CitySelector from '@/components/common/CitySelector.vue'
import NotificationBell from '@/components/common/NotificationBell.vue'
import PublishButton from '@/components/common/PublishButton.vue'
import UserDropdown from '@/components/common/UserDropdown.vue'
import CompetitionDropdown from '@/components/navigation/CompetitionDropdown.vue'
import ResearchDropdown from '@/components/navigation/ResearchDropdown.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const emit = defineEmits(['publish'])

// 搜索相关
const searchKeyword = ref('')
const isSearchFocused = ref(false)
const showSuggestions = ref(false)
const searchSuggestions = ref([])
const searchHistory = ref([])

// 加载搜索历史
const loadSearchHistory = () => {
  const history = localStorage.getItem('searchHistory')
  if (history) {
    try {
      searchHistory.value = JSON.parse(history).slice(0, 10)
    } catch (e) {
      searchHistory.value = []
    }
  }
}

// 保存搜索历史
const saveSearchHistory = (keyword) => {
  if (!keyword.trim()) return
  
  let history = searchHistory.value.filter(item => item !== keyword)
  history.unshift(keyword)
  history = history.slice(0, 10)
  
  searchHistory.value = history
  localStorage.setItem('searchHistory', JSON.stringify(history))
}

// 清空搜索历史
const clearSearchHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  searchSuggestions.value = []
}

// 获取建议图标
const getSuggestionIcon = (type) => {
  const icons = {
    post: '📝',
    competition: '🏆',
    research: '🔬',
    user: '👤',
    tag: '🏷️'
  }
  return icons[type] || '🔍'
}

// 搜索输入处理（防抖）
let searchTimer = null
const handleSearchInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  if (!searchKeyword.value.trim()) {
    searchSuggestions.value = []
    return
  }
  
  searchTimer = setTimeout(() => {
    fetchSearchSuggestions(searchKeyword.value)
  }, 300)
}

// 获取搜索建议
const fetchSearchSuggestions = (keyword) => {
  const mockSuggestions = [
    {
      id: 1,
      type: 'post',
      typeText: '帖子',
      title: `${keyword}经验分享`,
      subtitle: '包含关键词的帖子'
    },
    {
      id: 2,
      type: 'competition',
      typeText: '竞赛',
      title: `${keyword}大赛`,
      subtitle: '相关竞赛'
    },
    {
      id: 3,
      type: 'user',
      typeText: '用户',
      title: `${keyword}同学`,
      subtitle: '相关用户'
    },
    {
      id: 4,
      type: 'tag',
      typeText: '标签',
      title: `#${keyword}#`,
      subtitle: '相关标签'
    }
  ]
  
  searchSuggestions.value = mockSuggestions.filter(s => 
    s.title.toLowerCase().includes(keyword.toLowerCase())
  )
}

// 执行搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return
  
  saveSearchHistory(searchKeyword.value)
  showSuggestions.value = false
  
  router.push({
    path: '/search',
    query: { q: searchKeyword.value }
  })
}

// 选择历史记录
const selectHistoryItem = (item) => {
  searchKeyword.value = item
  handleSearch()
}

// 选择建议项
const selectSuggestion = (suggestion) => {
  if (suggestion.type === 'tag') {
    const tagName = suggestion.title.replace(/#/g, '')
    router.push({
      path: '/search',
      query: { tag: tagName }
    })
  } else {
    searchKeyword.value = suggestion.title
    handleSearch()
  }
}

// 处理发布
const handlePublish = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  } else {
    emit('publish')
  }
}

// 点击外部关闭建议
const handleClickOutside = (event) => {
  const searchWrapper = document.querySelector('.header-search')
  if (searchWrapper && !searchWrapper.contains(event.target)) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  loadSearchHistory()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
})
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
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-shrink: 0;
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

/* 搜索框 */
.header-search {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.search-wrapper {
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 24px;
  padding: 0 4px 0 16px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.search-wrapper.is-focused {
  background: white;
  border-color: #004e9e;
  box-shadow: 0 0 0 3px rgba(0, 78, 158, 0.1);
}

.search-icon {
  color: #94a3b8;
  font-size: 16px;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 0;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: #94a3b8;
}

.clear-search-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: #cbd5e1;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  transition: background 0.2s;
}

.clear-search-btn:hover {
  background: #94a3b8;
}

.search-btn {
  padding: 8px 20px;
  background: #004e9e;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.search-btn:hover {
  background: #0066cc;
}

/* 搜索建议下拉 */
.search-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e8ecf0;
  z-index: 1000;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.suggestion-section {
  padding: 8px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.clear-history-btn {
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: #004e9e;
  font-size: 12px;
  cursor: pointer;
}

.clear-history-btn:hover {
  text-decoration: underline;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: #f8fafc;
}

.history-icon,
.suggestion-icon {
  font-size: 16px;
  color: #94a3b8;
  width: 24px;
  text-align: center;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  margin-bottom: 2px;
}

.suggestion-subtitle {
  font-size: 12px;
  color: #94a3b8;
}

.suggestion-text {
  flex: 1;
  font-size: 14px;
  color: #1e293b;
}

.suggestion-type {
  font-size: 11px;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 12px;
  color: #64748b;
}

.suggestion-footer {
  padding: 12px 16px;
  border-top: 1px solid #edf1f7;
}

.search-all-btn {
  width: 100%;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #004e9e;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.search-all-btn:hover {
  background: #e8f0fe;
  border-color: #004e9e;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

/* 管理员链接样式 */
.admin-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #004e9e;
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}

.admin-link:hover {
  background: #0066cc;
}

/* 管理员小皇冠 */
.admin-crown {
  font-size: 20px;
  margin-left: -4px;
  filter: drop-shadow(0 0 4px gold);
  cursor: default;
}

.login-btn,
.register-btn {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.login-btn {
  background: transparent;
  border: 1px solid #004e9e;
  color: #004e9e;
}

.login-btn:hover {
  background: #e8f0fe;
}

.register-btn {
  background: #004e9e;
  border: 1px solid #004e9e;
  color: white;
}

.register-btn:hover {
  background: #0066cc;
}

/* 响应式 */
@media (max-width: 1024px) {
  .header-nav {
    display: none;
  }
  
  .header-search {
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 16px;
  }
  
  .header-search {
    max-width: 200px;
  }
  
  .search-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>