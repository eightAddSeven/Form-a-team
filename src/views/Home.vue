<template>
  <div class="main-layout">
    <!-- 左侧区域 -->
    <div class="left-content">
      <PostCreator @submit="handlePostSubmit" />
      <PostList 
        :posts="postStore.posts"
        :loading="postStore.loading"
        :loading-more="postStore.loadingMore"
        :has-more="postStore.hasMore"
        @loadMore="handleLoadMore"
        @tabChange="handleTabChange"
        @filterChange="handleFilterChange"
        @like="handleLike"
        @comment="handleComment"
        @share="handleShare"
        @collect="handleCollect"
      />
    </div>
    
    <!-- 右侧区域 -->
    <div class="right-sidebar">
      <HotSearch 
        :items="hotSearchList" 
        @itemClick="handleHotSearchClick"
      />
      <TopicTags 
        :tags="hotTopics" 
        @tagClick="handleTopicClick"
      />
      <div class="recommend-card">
        <h4>👥 推荐关注</h4>
        <div class="recommend-list">
          <div v-for="user in recommendUsers" :key="user.id" class="recommend-item">
            <img :src="user.avatar || defaultAvatar" alt="avatar" class="recommend-avatar" />
            <div class="recommend-info">
              <span class="recommend-name">{{ user.nickname }}</span>
              <span class="recommend-bio">{{ user.college }}</span>
            </div>
            <button class="follow-btn" @click="followUser(user)">+ 关注</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePostStore } from '@/stores/post'
import { postAPI, searchAPI } from '@/api'   // 导入 postAPI
import { ElMessage } from 'element-plus'
import PostCreator from '@/components/post/PostCreator.vue'
import PostList from '@/components/post/PostList.vue'
import HotSearch from '@/components/sidebar/HotSearch.vue'
import TopicTags from '@/components/sidebar/TopicTags.vue'

const router = useRouter()
const userStore = useUserStore()
const postStore = usePostStore()

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23e2e8f0\'/%3E%3Ccircle cx=\'20\' cy=\'15\' r=\'7\' fill=\'%2394a3b8\'/%3E%3Cpath d=\'M8 32 Q20 24, 32 32\' fill=\'%2394a3b8\'/%3E%3C/svg%3E'

const currentTab = ref('latest')
const currentCategory = ref('all')

const hotSearchList = ref([])
const hotTopics = ref([])
let hotSearchTimer = null

const recommendUsers = ref([
  { id: 1, nickname: '张三', college: '计算机学院', avatar: '' },
  { id: 2, nickname: '李四', college: '经济管理学院', avatar: '' },
  { id: 3, nickname: '王五', college: '地球科学学院', avatar: '' }
])

// 获取热搜榜单（真实帖子数据）
const fetchHotSearch = async () => {
  try {
    const response = await postAPI.getHotRank({ limit: 8 })
    if (response.data && response.data.success) {
      hotSearchList.value = response.data.data || []
    } else {
      hotSearchList.value = []
    }
  } catch (error) {
    console.error('获取热搜榜单失败:', error)
    hotSearchList.value = []
    // 可选：提示错误
    // ElMessage.error('热搜加载失败')
  }
}

// 获取热门标签（供 TopicTags 使用）
const fetchHotTags = async () => {
  try {
    const response = await searchAPI.getHotTags()
    hotTopics.value = response.data || []
  } catch (error) {
    console.error('获取热门标签失败:', error)
    hotTopics.value = []
  }
}

const handlePostSubmit = async (postData) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  const result = await postStore.createPost(postData)
  if (result.success) {
    ElMessage.success('发布成功')
    await postStore.fetchPosts({ page: 1, tab: currentTab.value, category: currentCategory.value })
  } else {
    ElMessage.error(result.error || '发布失败')
  }
}

const handleLoadMore = () => {
  postStore.fetchPosts({
    page: postStore.currentPage + 1,
    tab: currentTab.value,
    category: currentCategory.value
  })
}

const handleTabChange = (tab) => {
  const tabMap = { '最新': 'latest', '热门': 'hot', '关注': 'following', '推荐': 'recommend' }
  currentTab.value = tabMap[tab] || 'latest'
  postStore.fetchPosts({ page: 1, tab: currentTab.value, category: currentCategory.value })
}

const handleFilterChange = (filter) => {
  const filterMap = { 'all': 'all', 'competition': 'competition', 'research': 'research', 'team': 'team', 'question': 'question' }
  currentCategory.value = filterMap[filter] || 'all'
  postStore.fetchPosts({ page: 1, tab: currentTab.value, category: currentCategory.value })
}

const handleLike = async (post) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  const postId = post.id || post._id
  const result = await postStore.likePost(postId)
  if (result.success) {
    ElMessage.success(result.isLiked ? '点赞成功' : '取消点赞')
  }
}

const handleComment = (post) => {
  const postId = post.id || post._id
  router.push(`/post/${postId}#comments`)
}

const handleShare = (post) => {
  const postId = post.id || post._id
  const url = `${window.location.origin}/post/${postId}`
  navigator.clipboard?.writeText(url).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.info(`分享链接: ${url}`)
  })
}

const handleCollect = async (post) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  const postId = post.id || post._id
  const result = await postStore.collectPost(postId)
  if (result.success) {
    ElMessage.success(result.isCollected ? '收藏成功' : '取消收藏')
  }
}

const handleHotSearchClick = (item) => {
  if (item.postId) {
    router.push(`/post/${item.postId}`)
  } else if (item.url) {
    router.push(item.url)
  } else {
    const keyword = item.title || item.name || item.displayName
    router.push({ path: '/search', query: { q: keyword } })
  }
}

const handleTopicClick = (tag) => {
  router.push({ path: '/search', query: { tag } })
}

const followUser = (user) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  ElMessage.success(`已关注 ${user.nickname}`)
}

onMounted(async () => {
  await postStore.fetchPosts({ page: 1, tab: 'latest', category: 'all' })
  fetchHotSearch()
  fetchHotTags()

  // 每分钟刷新热搜榜
  hotSearchTimer = setInterval(() => {
    fetchHotSearch()
  }, 60000)
})

onUnmounted(() => {
  if (hotSearchTimer) {
    clearInterval(hotSearchTimer)
  }
})
</script>

<style scoped>
/* 样式保持不变，此处省略，与原文件相同 */
.main-layout { display: flex; gap: 24px; }
.left-content { flex: 4; display: flex; flex-direction: column; gap: 24px; }
.right-sidebar { flex: 1; display: flex; flex-direction: column; gap: 20px; }
.recommend-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #edf1f7; }
.recommend-card h4 { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
.recommend-list { display: flex; flex-direction: column; gap: 12px; }
.recommend-item { display: flex; align-items: center; gap: 10px; }
.recommend-avatar { width: 40px; height: 40px; border-radius: 50%; }
.recommend-info { flex: 1; display: flex; flex-direction: column; }
.recommend-name { font-size: 14px; font-weight: 500; color: #1e293b; }
.recommend-bio { font-size: 12px; color: #94a3b8; }
.follow-btn { padding: 4px 12px; background: transparent; border: 1px solid #004e9e; border-radius: 16px; color: #004e9e; font-size: 12px; cursor: pointer; transition: all 0.2s; }
.follow-btn:hover { background: #004e9e; color: white; }
@media (max-width: 1024px) { .main-layout { flex-direction: column; } .right-sidebar { order: -1; } }
</style>