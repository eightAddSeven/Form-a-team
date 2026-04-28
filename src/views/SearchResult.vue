<template>
  <div class="search-result-container">
    <!-- 搜索头部 -->
    <div class="search-header">
      <h2>
        <span v-if="tagInfo" class="tag-badge" :class="tagInfo.source">
          {{ tagInfo.source === 'competition' ? '🏆' : '🔬' }}
        </span>
        <span v-else-if="searchQuery" class="query-icon">🔍</span>
        {{ pageTitle }}
      </h2>
      <p class="result-count">
        {{ loading ? '搜索中...' : `共找到 ${posts.length} 篇相关帖子` }}
      </p>
    </div>
    
    <!-- 内容区域 -->
    <div class="content-layout">
      <!-- 左侧帖子列表 -->
      <div class="left-content">
        <!-- 空状态 -->
        <div v-if="!loading && posts.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>暂无相关帖子</p>
          <p class="empty-tip">试试其他关键词吧</p>
        </div>
        
        <!-- 帖子列表 -->
        <PostList 
          v-else
          :posts="posts"
          :loading="loading"
          :loading-more="loadingMore"
          :has-more="hasMore"
          @loadMore="loadMore"
        />
      </div>
      
      <!-- 右侧边栏 -->
      <div class="right-sidebar">
        <!-- 筛选卡片 -->
        <div class="filter-card">
          <h4>筛选</h4>
          <div class="filter-group">
            <label>排序方式</label>
            <select v-model="sortBy" @change="handleSortChange">
              <option value="latest">📅 最新发布</option>
              <option value="hot">🔥 最热</option>
              <option value="relevant">🎯 最相关</option>
            </select>
          </div>
          <div class="filter-group">
            <label>时间范围</label>
            <select v-model="timeRange" @change="handleFilterChange">
              <option value="all">全部时间</option>
              <option value="day">最近一天</option>
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
            </select>
          </div>
        </div>
        
        <!-- 相关标签推荐 -->
        <div class="related-tags-card" v-if="relatedTags.length > 0">
          <h4>相关标签</h4>
          <div class="related-tags">
            <span 
              v-for="tag in relatedTags" 
              :key="tag.name"
              class="related-tag"
              @click="searchByTag(tag)"
            >
              <span class="tag-icon">{{ tag.source === 'competition' ? '🏆' : '🔬' }}</span>
              <span class="tag-name">{{ tag.displayName || tag.name }}</span>
              <span class="tag-count">{{ tag.count }}</span>
            </span>
          </div>
        </div>
        
        <!-- 搜索提示 -->
        <div class="search-tips-card">
          <h4>💡 搜索提示</h4>
          <ul class="tips-list">
            <li>使用具体的关键词可以获得更精确的结果</li>
            <li>可以按标签筛选相关内容</li>
            <li>试试搜索竞赛名称或科研方向</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTagStore } from '@/stores/tagStore'
import { postAPI, searchAPI } from '@/api'
import PostList from '@/components/post/PostList.vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const tagStore = useTagStore()

const loading = ref(false)
const posts = ref([])
const hasMore = ref(false)
const total = ref(0)
const currentPage = ref(1)
const sortBy = ref('latest')
const timeRange = ref('all')
const relatedTags = ref([])
const loadingMore = ref(false)  // 新增
// 搜索参数
const searchQuery = computed(() => route.query.q || '')
const searchTag = computed(() => route.query.tag || '')

// 标签信息
const tagInfo = computed(() => {
  if (!searchTag.value) return null
  return tagStore.allTags?.find(t => t.displayName === searchTag.value)
})

// 页面标题
const pageTitle = computed(() => {
  if (tagInfo.value) {
    return `#${tagInfo.value.displayName}`
  }
  if (searchQuery.value) {
    return `"${searchQuery.value}"`
  }
  return '搜索'
})

// 获取搜索结果
const fetchSearchResults = async (isLoadMore = false) => {
  if (!searchQuery.value && !searchTag.value) {
    posts.value = []
    hasMore.value = false
    total.value = 0
    return
  }
  
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    currentPage.value = 1
    posts.value = []
  }
  
  try {
    const params = {
      page: currentPage.value,
      pageSize: 10
    }
    
    if (searchTag.value) {
      params.tag = searchTag.value
    } else if (searchQuery.value) {
      params.q = searchQuery.value
    }
    
    const res = await searchAPI.search(params)
    
    if (isLoadMore) {
      posts.value.push(...(res.data.posts || []))
    } else {
      posts.value = res.data.posts || []
    }
    
    hasMore.value = res.data.hasMore || false
    total.value = res.data.total || 0
    relatedTags.value = res.data.relatedTags || []
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (!loadingMore.value && hasMore.value) {
    currentPage.value++
    fetchSearchResults(true)
  }
}

// 刷新搜索
const refreshPosts = () => {
  fetchSearchResults()
}

// 按标签搜索
const searchByTag = (tag) => {
  router.push({ path: '/search', query: { tag: tag.displayName || tag.name } })
}

// 监听排序变化
const handleSortChange = () => {
  fetchSearchResults()
}

// 监听路由变化
watch(
  () => [route.query.q, route.query.tag],
  () => {
    fetchSearchResults()
  },
  { immediate: true }
)

onMounted(() => {
  fetchSearchResults()
})
</script>

<style scoped>
.search-result-container {
  max-width: 1200px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: 24px;
}

.search-header h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 26px;
  color: #1e293b;
}

.tag-badge {
  font-size: 28px;
}

.tag-badge.competition {
  color: #d97706;
}

.tag-badge.research {
  color: #16a34a;
}

.query-icon {
  font-size: 24px;
  color: #64748b;
}

.result-count {
  color: #94a3b8;
  font-size: 14px;
  margin-top: 6px;
}

.content-layout {
  display: flex;
  gap: 24px;
}

.left-content {
  flex: 1;
  min-width: 0;
}

.right-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 空状态 */
.empty-state {
  background: white;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  color: #64748b;
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-tip {
  font-size: 14px;
  color: #94a3b8;
}

/* 卡片样式 */
.filter-card,
.related-tags-card,
.search-tips-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf1f7;
}

.filter-card h4,
.related-tags-card h4,
.search-tips-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.filter-group {
  margin-bottom: 16px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group label {
  display: block;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.filter-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: white;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-group select:hover {
  border-color: #004e9e;
}

.filter-group select:focus {
  border-color: #004e9e;
  box-shadow: 0 0 0 3px rgba(0, 78, 158, 0.1);
}

/* 相关标签 */
.related-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-tag {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.related-tag:hover {
  background: #e8f0fe;
  transform: translateX(4px);
}

.tag-icon {
  font-size: 16px;
}

.tag-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.tag-count {
  font-size: 12px;
  padding: 2px 8px;
  background: #e2e8f0;
  border-radius: 12px;
  color: #64748b;
}

/* 搜索提示 */
.tips-list {
  list-style: none;
  padding: 0;
}

.tips-list li {
  position: relative;
  padding: 8px 0 8px 20px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.tips-list li::before {
  content: '•';
  position: absolute;
  left: 6px;
  color: #004e9e;
  font-weight: bold;
}

/* 响应式 */
@media (max-width: 768px) {
  .content-layout {
    flex-direction: column;
  }
  
  .right-sidebar {
    width: 100%;
    order: -1;
  }
  
  .search-header h2 {
    font-size: 20px;
  }
}
</style>