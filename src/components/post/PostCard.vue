<template>
  <div class="post-card" @click="$emit('click', post)">
    <div class="post-header">
      <img 
        :src="post.author?.avatar || defaultAvatar" 
        alt="avatar" 
        class="author-avatar"
        @click.stop="goToProfile"
      />
      <div class="post-info">
        <div class="author-info">
          <span class="author-name" @click.stop="goToProfile">
  {{ post.author?.nickname || '匿名用户' }}
  <span v-if="post.author?.role === 'admin'" class="admin-badge-small" title="管理员">👑</span>
</span>
          <span class="post-time">{{ formatTime(post.createdAt) }}</span>
        </div>
        <h4 class="post-title">{{ post.title || '无标题' }}</h4>
      </div>
    </div>
    
    <div class="post-content">
      <p>{{ truncateContent(post.content) }}</p>
    </div>
    
    <div class="post-tags" v-if="post.tags && post.tags.length">
      <span 
        class="tag" 
        v-for="tag in post.tags.slice(0, 3)" 
        :key="tag"
        @click.stop="searchByTag(tag)"
      >
        #{{ tag }}
      </span>
      <span v-if="post.tags.length > 3" class="tag more">
        +{{ post.tags.length - 3 }}
      </span>
    </div>
    
    <div class="post-actions">
      <!-- 浏览量显示 -->
      <span class="views-stat" title="浏览量">
        <span class="stat-icon">👁️</span>
        <span class="stat-number">{{ post.views || 0 }}</span>
      </span>

      <button 
        class="action-btn" 
        @click.stop="handleLike"
        :class="{ active: post.isLiked }"
      >
        <span>{{ post.isLiked ? '❤️' : '🤍' }}</span>
        {{ post.likes?.length || post.likes || 0 }}
      </button>
      <button class="action-btn" @click.stop="handleComment">
        <span>💬</span>
        {{ post.comments?.length || post.comments || 0 }}
      </button>
      <button class="action-btn" @click.stop="handleShare">
        <span>📤</span>
        分享
      </button>
      <button 
        class="action-btn" 
        @click.stop="handleCollect"
        :class="{ active: post.isCollected }"
      >
        <span>{{ post.isCollected ? '⭐' : '☆' }}</span>
        收藏
      </button>
      <!-- 删除按钮：作者或管理员可见 -->
      <button 
        v-if="canDelete"
        class="action-btn delete-btn" 
        @click.stop="handleDelete"
      >
        🗑️ 删除
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePostStore } from '@/stores/post'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'like', 'comment', 'share', 'collect'])

const router = useRouter()
const userStore = useUserStore()
const postStore = usePostStore()

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23e2e8f0\'/%3E%3Ccircle cx=\'20\' cy=\'15\' r=\'7\' fill=\'%2394a3b8\'/%3E%3Cpath d=\'M8 32 Q20 24, 32 32\' fill=\'%2394a3b8\'/%3E%3C/svg%3E'

// 当前登录用户的 ID
const currentUserId = computed(() => userStore.userInfo?._id || userStore.userInfo?.id)

// 是否允许删除：作者本人 或 管理员
const canDelete = computed(() => {
  const authorId = props.post.author?._id || props.post.author?.id
  return authorId === currentUserId.value || userStore.isAdmin
})

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  
  return date.toLocaleDateString('zh-CN', { 
    month: 'numeric', 
    day: 'numeric' 
  })
}

// 截断内容
const truncateContent = (content) => {
  if (!content) return ''
  return content.length > 150 ? content.slice(0, 150) + '...' : content
}

// 跳转到用户主页
const goToProfile = () => {
  const authorId = props.post.author?.id || props.post.author?._id
  if (authorId) {
    router.push(`/profile/${authorId}`)
  }
}

// 按标签搜索
const searchByTag = (tag) => {
  router.push({ path: '/search', query: { tag } })
}

const handleLike = () => {
  emit('like', props.post)
}

const handleComment = () => {
  emit('comment', props.post)
}

const handleShare = () => {
  emit('share', props.post)
}

const handleCollect = () => {
  emit('collect', props.post)
}

// 删除帖子
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这篇帖子吗？此操作不可恢复。',
      '删除帖子',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const postId = props.post.id || props.post._id
    await postStore.deletePost(postId)
    ElMessage.success('帖子已删除')
    // 通知父组件刷新列表（如果有需要，可以通过 emit 一个事件）
    // emit('delete', props.post)  // 可选，如果父组件需要额外处理
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除帖子失败:', error)
      ElMessage.error('删除失败')
    }
  }
}
</script>

<style scoped>
.admin-badge-small {
  font-size: 14px;
  margin-left: 4px;
  filter: drop-shadow(0 0 3px gold);
}

.post-card {
  padding: 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #edf1f7;
}

.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #004e9e;
}

.post-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.post-info {
  flex: 1;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.author-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  cursor: pointer;
}

.author-name:hover {
  color: #004e9e;
}

.post-time {
  font-size: 12px;
  color: #94a3b8;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.post-title:hover {
  color: #004e9e;
}

.post-content {
  margin-left: 52px;
  margin-bottom: 12px;
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
}

.post-tags {
  margin-left: 52px;
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 16px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.tag:hover {
  background: #004e9e;
  color: white;
}

.post-actions {
  margin-left: 52px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.views-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #64748b;
  font-size: 14px;
  user-select: none;
}

.stat-icon {
  font-size: 16px;
}

.stat-number {
  font-weight: 500;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 20px;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f1f5f9;
  color: #004e9e;
}

.action-btn.active {
  color: #ef4444;
}

/* 删除按钮特殊样式 */
.delete-btn {
  color: #ef4444;
}
.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}
</style>