<template>
  <div class="main-layout">
    <!-- 左侧区域 -->
    <div class="left-content">
      <!-- 发布框 -->
      <PostCreator @submit="handlePostSubmit" />
      
      <!-- 帖子列表 -->
      <PostList 
        :posts="currentPosts"
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
      <!-- 热搜榜 -->
      <HotSearch 
        :items="hotSearchList" 
        @itemClick="handleHotSearchClick"
      />
      
      <!-- 热门话题 -->
      <TopicTags 
        :tags="hotTopics" 
        @tagClick="handleTopicClick"
      />
      
      <!-- 推荐用户 -->
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePostStore } from '@/stores/post'
import { ElMessage } from 'element-plus'
import PostCreator from '@/components/post/PostCreator.vue'
import PostList from '@/components/post/PostList.vue'
import HotSearch from '@/components/sidebar/HotSearch.vue'
import TopicTags from '@/components/sidebar/TopicTags.vue'

const router = useRouter()
const userStore = useUserStore()
const postStore = usePostStore()

// 默认头像
const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23e2e8f0\'/%3E%3Ccircle cx=\'20\' cy=\'15\' r=\'7\' fill=\'%2394a3b8\'/%3E%3Cpath d=\'M8 32 Q20 24, 32 32\' fill=\'%2394a3b8\'/%3E%3C/svg%3E'

// 当前筛选状态
const currentTab = ref('latest')
const currentCategory = ref('all')

// 当前显示的帖子
const currentPosts = computed(() => {
  let posts = [...postStore.posts]
  
  // 按分类筛选
  if (currentCategory.value !== 'all') {
    posts = posts.filter(p => p.category === currentCategory.value)
  }
  
  // 排序
  switch (currentTab.value) {
    case 'hot':
      posts.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
      break
    case 'latest':
    default:
      posts.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      break
  }
  
  return posts
})

// 热搜数据

// 改为从 API 获取
import { searchAPI } from '@/api'

const hotSearchList = ref([])
const hotTopics = ref([])

// 获取热门标签
const fetchHotTags = async () => {
  try {
    const response = await searchAPI.getHotTags()
    hotSearchList.value = response.data || []
  } catch (error) {
    console.error('获取热门标签失败:', error)
  }
}

onMounted(() => {
  postStore.fetchPosts({ page: 1 })
  fetchHotTags()
})

// 发布帖子
const handlePostSubmit = async (postData) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  const result = await postStore.createPost(postData)
  if (result.success) {
    ElMessage.success('发布成功')
    // 刷新帖子列表
    await postStore.fetchPosts({ page: 1, tab: currentTab.value, category: currentCategory.value })
  } else {
    ElMessage.error(result.error || '发布失败')
  }
}

// 加载更多
const handleLoadMore = () => {
  postStore.fetchPosts({
    page: postStore.currentPage + 1,
    tab: currentTab.value,
    category: currentCategory.value
  })
}

// 标签切换
const handleTabChange = (tab) => {
  const tabMap = {
    '最新': 'latest',
    '热门': 'hot',
    '关注': 'following',
    '推荐': 'recommend'
  }
  currentTab.value = tabMap[tab] || 'latest'
  postStore.fetchPosts({ page: 1, tab: currentTab.value, category: currentCategory.value })
}

// 筛选变化
const handleFilterChange = (filter) => {
  const filterMap = {
    'all': 'all',
    'competition': 'competition',
    'research': 'research',
    'team': 'team',
    'question': 'question'
  }
  currentCategory.value = filterMap[filter] || 'all'
  postStore.fetchPosts({ page: 1, tab: currentTab.value, category: currentCategory.value })
}

// 点赞
const handleLike = async (post) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  const result = await postStore.likePost(post.id)
  if (result.success) {
    ElMessage.success(result.isLiked ? '点赞成功' : '取消点赞')
  }
}

// 评论
const handleComment = (post) => {
  router.push(`/post/${post.id}#comments`)
}

// 分享
const handleShare = (post) => {
  const url = `${window.location.origin}/post/${post.id}`
  navigator.clipboard?.writeText(url).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.info(`分享链接: ${url}`)
  })
}

// 收藏
const handleCollect = async (post) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  const result = await postStore.collectPost(post.id)
  if (result.success) {
    ElMessage.success(result.isCollected ? '收藏成功' : '取消收藏')
  }
}

// 热搜点击
const handleHotSearchClick = (item) => {
  router.push({ path: '/search', query: { q: item.title } })
}

// 话题点击
const handleTopicClick = (tag) => {
  router.push({ path: '/search', query: { tag } })
}

// 关注用户
const followUser = (user) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  ElMessage.success(`已关注 ${user.nickname}`)
}

// 初始化
onMounted(() => {
  postStore.fetchPosts({ page: 1, tab: 'latest', category: 'all' })
})
</script>

<style scoped>
.main-layout {
  display: flex;
  gap: 24px;
}

.left-content {
  flex: 4;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recommend-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf1f7;
}

.recommend-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.recommend-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.recommend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.recommend-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.recommend-bio {
  font-size: 12px;
  color: #94a3b8;
}

.follow-btn {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid #004e9e;
  border-radius: 16px;
  color: #004e9e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-btn:hover {
  background: #004e9e;
  color: white;
}

@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }
  
  .right-sidebar {
    order: -1;
  }
}
</style>