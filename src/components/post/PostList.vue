<template>
  <div class="post-list-section">
    <div class="section-header">
      <div class="header-tabs">
        <span 
          v-for="tab in tabs" 
          :key="tab"
          class="tab"
          :class="{ active: activeTab === tab }"
          @click="handleTabChange(tab)"
        >
          {{ tab }}
        </span>
      </div>
      <div class="header-filter">
        <select class="filter-select" v-model="filterType" @change="handleFilterChange">
          <option value="all">全部帖子</option>
          <option value="competition">竞赛经验</option>
          <option value="research">科研项目</option>
          <option value="team">组队招募</option>
          <option value="question">求助问答</option>
        </select>
      </div>
    </div>
    
    <!-- 帖子列表 -->
    <div class="post-list">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="posts.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <p>暂无帖子，快来发布第一条吧！</p>
      </div>
      
      <!-- 帖子列表 -->
      <div v-else>
        <PostCard 
          v-for="post in posts" 
          :key="post.id"
          :post="post"
          @click="handlePostClick(post)"
          @like="handleLike(post)"
          @comment="handleComment(post)"
          @share="handleShare(post)"
          @collect="handleCollect(post)"
        />
      </div>
    </div>
    
    <!-- 加载更多 -->
    <div class="load-more" v-if="hasMore && !loading && posts.length > 0">
      <button class="load-more-btn" @click="handleLoadMore" :disabled="loadingMore">
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </button>
    </div>
    
    <!-- 没有更多数据 -->
    <div class="no-more" v-if="!hasMore && posts.length > 0">
      <span>已经到底啦 ~</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PostCard from './PostCard.vue'

const router = useRouter()

// Props
const props = defineProps({
  posts: {
    type: Array,
    default: () => []
  },
  hasMore: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'loadMore', 
  'postClick', 
  'like', 
  'comment', 
  'share', 
  'collect',
  'tabChange',
  'filterChange'
])

// 响应式数据
const activeTab = ref('最新')
const filterType = ref('all')
const tabs = ref(['最新', '热门', '关注', '推荐'])

// 方法
const handleTabChange = (tab) => {
  activeTab.value = tab
  emit('tabChange', tab)
}

const handleFilterChange = () => {
  emit('filterChange', filterType.value)
}

const handleLoadMore = () => {
  if (!props.loadingMore) {
    emit('loadMore')
  }
}

const handlePostClick = (post) => {
  emit('postClick', post)
  router.push(`/post/${post.id}`)
}

const handleLike = (post) => {
  // 检查是否登录
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录后再点赞')
    router.push('/login')
    return
  }
  
  // 切换点赞状态
  post.isLiked = !post.isLiked
  post.likes += post.isLiked ? 1 : -1
  
  emit('like', post)
  ElMessage.success(post.isLiked ? '点赞成功' : '取消点赞')
}

const handleComment = (post) => {
  emit('comment', post)
  router.push(`/post/${post.id}#comments`)
}

const handleShare = (post) => {
  emit('share', post)
  
  // 复制链接到剪贴板
  const url = `${window.location.origin}/post/${post.id}`
  navigator.clipboard?.writeText(url).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.info(`分享链接: ${url}`)
  })
}

const handleCollect = (post) => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录后再收藏')
    router.push('/login')
    return
  }
  
  post.isCollected = !post.isCollected
  emit('collect', post)
  ElMessage.success(post.isCollected ? '收藏成功' : '取消收藏')
}

// 监听筛选变化
watch(filterType, (newVal) => {
  console.log('筛选类型变化:', newVal)
})
</script>

<style scoped>
.post-list-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf1f7;
  min-height: 500px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f3f8;
}

.header-tabs {
  display: flex;
  gap: 24px;
}

.tab {
  font-size: 16px;
  color: #64748b;
  cursor: pointer;
  padding-bottom: 16px;
  margin-bottom: -18px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  font-weight: 500;
}

.tab:hover {
  color: #004e9e;
}

.tab.active {
  color: #004e9e;
  font-weight: 600;
  border-bottom-color: #004e9e;
}

.filter-select {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 14px;
  color: #475569;
  background: white;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: #004e9e;
}

.filter-select:focus {
  border-color: #004e9e;
  box-shadow: 0 0 0 3px rgba(0, 78, 158, 0.1);
}

.post-list {
  min-height: 400px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #004e9e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
  display: block;
}

.empty-state p {
  font-size: 16px;
  color: #64748b;
}

/* 加载更多 */
.load-more {
  text-align: center;
  margin-top: 32px;
}

.load-more-btn {
  padding: 10px 32px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #004e9e;
  color: #004e9e;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 没有更多数据 */
.no-more {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #edf1f7;
  color: #94a3b8;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .post-list-section {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-tabs {
    width: 100%;
    justify-content: space-around;
    gap: 0;
  }
  
  .tab {
    font-size: 14px;
  }
  
  .filter-select {
    width: 100%;
  }
}
</style>