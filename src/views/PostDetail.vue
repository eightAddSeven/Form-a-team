<template>
  <div class="post-detail-container">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="!post" class="error-state">
      <span class="error-icon">😕</span>
      <p>帖子不存在或已被删除</p>
      <button @click="goBack" class="back-btn">返回首页</button>
    </div>
    
    <template v-else>
      <div class="post-detail-content">
        <div class="back-nav">
          <button @click="goBack" class="back-btn">← 返回</button>
        </div>
        
        <div class="post-main">
          <h1 class="post-title">{{ post.title || '无标题' }}</h1>
          
          <div class="post-meta">
            <div class="author-info" @click="goToProfile">
              <img 
                :src="post.author?.avatar || defaultAvatar" 
                alt="avatar" 
                class="author-avatar" 
              />
              <div class="author-details">
                <span class="author-name">{{ post.author?.nickname || '匿名用户' }}</span>
                <span class="post-time">{{ formatTime(post.createdAt) }}</span>
              </div>
            </div>
            <div class="post-stats">
              <span>👁️ {{ post.views || 0 }}</span>
              <span>💬 {{ post.comments?.length || 0 }}</span>
              <span>❤️ {{ post.likes?.length || 0 }}</span>
            </div>
          </div>
          
          <div class="post-content" v-html="renderContent(post.content)"></div>
          
          <div class="post-attachments" v-if="post.attachments && post.attachments.length > 0">
            <h4 class="attachments-title">📎 附件下载 ({{ post.attachments.length }})</h4>
            <div class="attachments-list">
              <a 
                v-for="(file, index) in post.attachments" 
                :key="index" 
                :href="file.url || file" 
                target="_blank" 
                class="attachment-item"
                download
              >
                <span class="attachment-icon">📄</span>
                <span class="attachment-name">{{ file.name || getFileName(file.url || file) }}</span>
              </a>
            </div>
          </div>
          
          <div class="post-tags" v-if="post.tags && post.tags.length">
            <span 
              class="tag" 
              v-for="tag in post.tags" 
              :key="tag"
              @click="searchByTag(tag)"
            >
              #{{ tag }}
            </span>
          </div>
          
          <div class="post-actions">
            <button class="action-btn" @click.stop="handleLike" :class="{ liked: post.isLiked }">
              <span>{{ post.isLiked ? '❤️' : '🤍' }}</span>
              {{ post.likes?.length || 0 }} 点赞
            </button>
            <button class="action-btn" @click="focusComment">
              <span>💬</span>
              {{ post.comments?.length || 0 }} 评论
            </button>
            <button class="action-btn" @click="handleShare">
              <span>📤</span>
              分享
            </button>
            <button class="action-btn" @click.stop="handleCollect" :class="{ collected: post.isCollected }">
              <span>{{ post.isCollected ? '⭐' : '☆' }}</span>
              收藏
            </button>
          </div>
        </div>
        
        <div class="comments-section" id="comments">
          <h3>评论 ({{ post.commentCount || post.comments?.length || 0 }})</h3>
          
          <div class="comment-input-wrapper">
            <textarea 
              v-model="newComment" 
              placeholder="写下你的评论..."
              rows="3"
              class="comment-textarea"
              ref="commentInput"
            ></textarea>
            <button @click="submitComment" class="submit-comment-btn" :disabled="!userStore.isLoggedIn || submitting">
              {{ submitting ? '发表中...' : (userStore.isLoggedIn ? '发表评论' : '请先登录') }}
            </button>
          </div>
          
          <div class="comments-list">
            <div v-if="!post.comments || post.comments.length === 0" class="empty-comments">
              <p>暂无评论，快来抢沙发吧~</p>
            </div>
            
            <div v-else class="comment-item" v-for="comment in post.comments" :key="comment._id">
              <img 
                :src="comment.author?.avatar || defaultAvatar" 
                alt="avatar" 
                class="comment-avatar" 
              />
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.author?.nickname || '匿名用户' }}</span>
                  <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>

                <button 
                  v-if="canDeleteComment(comment)" 
                  class="delete-comment-btn" 
                  @click="handleDeleteComment(comment._id)"
                  :disabled="deleting"
                >
                删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="post-sidebar">
        <div class="author-card" @click="goToProfile">
          <img 
            :src="post.author?.avatar || defaultAvatar" 
            alt="avatar" 
            class="author-card-avatar" 
          />
          <h4>{{ post.author?.nickname || '匿名用户' }}</h4>
          <p class="author-bio">{{ post.author?.bio || '这个人很懒，什么都没写...' }}</p>
          <p class="author-college" v-if="post.author?.college">
            {{ post.author.college }} · {{ post.author.major }}
          </p>
          <button 
            class="follow-btn" 
            @click.stop="toggleFollow"
            :class="{ following: isFollowing }"
          >
            {{ isFollowing ? '✓ 已关注' : '+ 关注' }}
          </button>
        </div>
        
        <div class="related-posts">
          <h4>相关推荐</h4>
          <div class="related-post-item" v-for="i in 3" :key="i">
            <h5>相关帖子标题 {{ i }}</h5>
            <span>❤️ {{ Math.floor(Math.random() * 100) }} 点赞</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePostStore } from '@/stores/post'
import { postAPI, userAPI } from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const postStore = usePostStore()
const submitting = ref(false)
const deleting = ref(false)
const loading = ref(true)
const post = computed(() => postStore.currentPost)
const newComment = ref('')
const commentInput = ref(null)
const isFollowing = ref(false)

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23e2e8f0\'/%3E%3Ccircle cx=\'20\' cy=\'15\' r=\'7\' fill=\'%2394a3b8\'/%3E%3Cpath d=\'M8 32 Q20 24, 32 32\' fill=\'%2394a3b8\'/%3E%3C/svg%3E'

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const renderContent = (content) => {
  if (!content) return ''
  return content.replace(/\n/g, '<br>')
}

// ✅ 新增：提取文件名的辅助函数，防止有些文件没有 name 属性
const getFileName = (url) => {
  if (!url || typeof url !== 'string') return '未知文件';
  const parts = url.split('/');
  return parts[parts.length - 1] || '附件';
}

const goBack = () => {
  router.back()
}

const goToProfile = () => {
  const authorId = post.value?.author?._id || post.value?.author?.id
  if (authorId) {
    router.push(`/profile/${authorId}`)
  }
}

const searchByTag = (tag) => {
  router.push({ path: '/search', query: { tag } })
}

const focusComment = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  commentInput.value?.focus()
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  const postId = route.params.id
  const result = await postStore.likePost(postId)
  if (result.success) {
    post.value.isLiked = result.isLiked
    post.value.likes = result.likes
  }
}

const handleShare = () => {
  const url = window.location.href
  navigator.clipboard?.writeText(url).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.info(`分享链接: ${url}`)
  })
}

const handleCollect = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  const postId = route.params.id
  const result = await postStore.collectPost(postId)
  if (result.success) {
    post.value.isCollected = result.isCollected
    ElMessage.success(result.isCollected ? '收藏成功' : '已取消收藏')
  } else {
    ElMessage.error(result.error || '操作失败')
  }
}

const toggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  const targetId = post.value?.author?._id || post.value?.author?.id
  if (!targetId) {
    ElMessage.warning('无法获取用户信息')
    return
  }
  try {
    const res = await userAPI.followUser(targetId)
    isFollowing.value = res.data.isFollowing
    ElMessage.success(isFollowing.value ? '关注成功' : '已取消关注')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const checkFollowStatus = async () => {
  if (!userStore.isLoggedIn) return
  const targetId = post.value?.author?._id || post.value?.author?.id
  if (!targetId) return
  
  try {
    const currentUserRes = await userAPI.getUser(userStore.userInfo._id)
    isFollowing.value = currentUserRes.data.following?.includes(targetId) || false
  } catch (error) {
    console.error('检查关注状态失败:', error)
  }
}

const fetchPostDetail = async () => {
  loading.value = true
  const postId = route.params.id
  try {
    const result = await postStore.fetchPostById(postId)
    if (!result.success) {
      ElMessage.error('帖子不存在')
      postStore.currentPost = null
    } else {
      const postData = postStore.currentPost
      if (!Array.isArray(postData.comments)) {
        postData.comments = []
      }
      // 兼容附件为空的情况
      if (!Array.isArray(postData.attachments)) {
        postData.attachments = []
      }
    }

    console.log('帖子详情:', post.value)
    await checkFollowStatus()
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    postStore.currentPost = null
  } finally {
    loading.value = false
  }
}

const canDeleteComment = (comment) => {
  if (!userStore.isLoggedIn) return false
  const currentUserId = userStore.userInfo?._id || userStore.userInfo?.id
  if (!currentUserId) return false

  const commentAuthorId = comment.author?._id || comment.author?.id
  const postAuthorId = post.value?.author?._id || post.value?.author?.id

  return currentUserId === commentAuthorId || currentUserId === postAuthorId
}

const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  const content = newComment.value.trim()
  if (!content) {
    ElMessage.warning('评论内容不能为空')
    return
  }

  submitting.value = true
  try {
    const result = await postStore.addComment(route.params.id, content)
    if (result.success) {
      newComment.value = ''
      ElMessage.success('评论成功')
    } else {
      ElMessage.error(result.error || '评论失败')
    }
  } catch (error) {
    ElMessage.error('评论失败')
  } finally {
    submitting.value = false
  }
}

const handleDeleteComment = async (commentId) => {
  deleting.value = true
  try {
    const result = await postStore.deleteComment(route.params.id, commentId)
    if (result.success) {
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchPostDetail()
})
</script>

<style scoped>
.post-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
}

.loading-state,
.error-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #004e9e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
}

.back-btn {
  padding: 10px 24px;
  background: #004e9e;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  margin-top: 20px;
}

.post-detail-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.back-nav {
  margin-bottom: 20px;
}

.back-nav .back-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #64748b;
  margin-top: 0;
}

.post-title {
  font-size: 28px;
  color: #1e293b;
  margin-bottom: 20px;
  line-height: 1.4;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #edf1f7;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #1e293b;
}

.post-time {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}

.post-stats {
  display: flex;
  gap: 20px;
  color: #64748b;
  font-size: 14px;
}

.post-content {
  font-size: 16px;
  line-height: 1.8;
  color: #334155;
  margin-bottom: 24px;
}

.post-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.tag {
  padding: 6px 14px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.tag:hover {
  background: #004e9e;
  color: white;
}

.post-actions {
  display: flex;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #edf1f7;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f8fafc;
  border-color: #004e9e;
  color: #004e9e;
}

.action-btn.liked {
  color: #ef4444;
  border-color: #ef4444;
}

.comments-section {
  margin-top: 40px;
}

.comments-section h3 {
  font-size: 18px;
  color: #1e293b;
  margin-bottom: 20px;
}

.comment-input-wrapper {
  margin-bottom: 30px;
}

.comment-textarea {
  width: 100%;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.submit-comment-btn {
  margin-top: 12px;
  padding: 10px 24px;
  background: #004e9e;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.submit-comment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid #edf1f7;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: #1e293b;
}

.comment-time {
  font-size: 13px;
  color: #94a3b8;
}

.comment-text {
  color: #475569;
  line-height: 1.6;
}

.post-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.author-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.author-card-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 16px;
}

.author-card h4 {
  font-size: 18px;
  color: #1e293b;
  margin-bottom: 8px;
}

.author-bio {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 8px;
}

.author-college {
  color: #94a3b8;
  font-size: 13px;
  margin-bottom: 16px;
}

.follow-btn {
  padding: 8px 24px;
  background: #004e9e;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.related-posts {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.related-posts h4 {
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 16px;
}

.related-post-item {
  padding: 12px 0;
  border-bottom: 1px solid #edf1f7;
  cursor: pointer;
}

.related-post-item h5 {
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 6px;
}

.related-post-item span {
  font-size: 12px;
  color: #94a3b8;
}
.delete-comment-btn {
  margin-top: 8px;
  padding: 4px 12px;
  background: transparent;
  border: 1px solid #ef4444;
  border-radius: 16px;
  color: #ef4444;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-comment-btn:hover {
  background: #ef4444;
  color: white;
}

.delete-comment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .post-detail-container {
    grid-template-columns: 1fr;
  }
}

/* ✅ 新增：附件模块的样式 */
.post-attachments {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
}

.attachments-title {
  font-size: 14px;
  color: #475569;
  margin-bottom: 12px;
  font-weight: 600;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  text-decoration: none;
  color: #004e9e;
  font-size: 14px;
  transition: all 0.2s ease;
  width: fit-content;
}

.attachment-item:hover {
  border-color: #004e9e;
  background: #f0f7ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 78, 158, 0.05);
}

.attachment-icon {
  font-size: 18px;
}

.attachment-name {
  word-break: break-all;
}
</style>