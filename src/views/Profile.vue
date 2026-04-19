<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-cover">
        <CoverUpload 
          :current-cover="userInfo.cover"
          @update="handleCoverUpdate"
        />
      </div>
      
      <div class="profile-info">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <AvatarUpload 
              :current-avatar="userInfo.avatar"
              @update="handleAvatarUpdate"
            />
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-header">
            <div class="user-main">
              <h2 class="user-name">{{ userInfo.nickname || userInfo.username }}</h2>
              <span class="user-badge" v-if="userInfo.verified">✓ 已认证</span>
              <span class="user-level">Lv.{{ userInfo.level || 1 }}</span>
            </div>
            
            <div class="user-actions">
              <template v-if="isOwnProfile">
                <button class="edit-profile-btn" @click="openEditModal">
                  ✏️ 编辑资料
                </button>
                <button class="share-profile-btn" @click="shareProfile">
                  📤 分享
                </button>
              </template>
              <template v-else>
                <button class="follow-btn" @click="toggleFollow" :class="{ following: isFollowing }">
                  {{ isFollowing ? '✓ 已关注' : '+ 关注' }}
                </button>
                <button class="message-btn" @click="sendMessage">
                  💬 私信
                </button>
              </template>
            </div>
          </div>
          
          <p class="user-bio">{{ userInfo.bio || '这个人很懒，什么都没写...' }}</p>
          
          <div class="user-meta">
            <span class="meta-item">
              <span class="meta-icon">🎓</span>
              {{ userInfo.college || '未填写' }} · {{ userInfo.major || '未填写' }}
            </span>
            <span class="meta-item">
              <span class="meta-icon">📅</span>
              {{ userInfo.grade || '未填写' }}
            </span>
            <span class="meta-item">
              <span class="meta-icon">📧</span>
              {{ userInfo.email || '未填写' }}
            </span>
            <span class="meta-item">
              <span class="meta-icon">📍</span>
              {{ userInfo.location || '未填写' }}
            </span>
          </div>
          
          <div class="user-stats">
            <div class="stat-item" @click="activeTab = 'following'">
              <span class="stat-value">{{ userInfo.following || 0 }}</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-item" @click="activeTab = 'followers'">
              <span class="stat-value">{{ userInfo.followers || 0 }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ userInfo.posts || userPosts.length }}</span>
              <span class="stat-label">帖子</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ userInfo.likes || 0 }}</span>
              <span class="stat-label">获赞</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="profile-content">
      <div class="content-tabs">
        <span 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          {{ tab.label }}
          <span class="tab-count" v-if="tabCounts[tab.key]">
            {{ tabCounts[tab.key] }}
          </span>
        </span>
      </div>
      
      <div class="content-panel">
        <div v-if="activeTab === 'posts'" class="posts-panel">
          <div class="panel-header">
            <h3>我的帖子</h3>
            <button class="filter-btn" @click="showPostFilter = !showPostFilter">
              筛选 ▼
            </button>
          </div>
          
          <div class="post-filter" v-if="showPostFilter">
            <select v-model="postFilter" class="filter-select">
              <option value="all">全部帖子</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="archived">已归档</option>
            </select>
          </div>
          
          <div class="posts-list">
            <div v-if="filteredPosts.length === 0" class="empty-state">
              <span class="empty-icon">📝</span>
              <p>还没有发布任何帖子</p>
              <button class="create-post-btn" @click="createNewPost">
                发布第一篇帖子
              </button>
            </div>
            
            <div v-else class="post-cards">
              <div v-for="post in filteredPosts" :key="post.id" class="post-card">
                <div class="post-header">
                  <h4 class="post-title" @click="viewPost(post.id)">
                    {{ post.title || '无标题' }}
                  </h4>
                  <div class="post-actions">
                    <button class="action-btn" @click="editPost(post)" title="编辑">
                      ✏️
                    </button>
                    <button class="action-btn" @click="deletePost(post)" title="删除">
                      🗑️
                    </button>
                  </div>
                </div>
                <p class="post-preview">{{ post.content }}</p>
                <div class="post-meta">
                  <span>{{ new Date(post.createTime).toLocaleDateString() }}</span>
                  <span>❤️ {{ post.likes }}</span>
                  <span>💬 {{ post.comments }}</span>
                  <span>👁️ {{ post.views || 0 }}</span>
                  <span class="post-status" :class="post.status">
                    {{ getStatusText(post.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'collections'" class="collections-panel">
          <div class="panel-header">
            <h3>我的收藏</h3>
            <button class="filter-btn" @click="showCollectionFilter = !showCollectionFilter">
              分类 ▼
            </button>
          </div>
          
          <div class="collection-filter" v-if="showCollectionFilter">
            <div class="filter-tags">
              <span 
                v-for="tag in collectionTags" 
                :key="tag"
                class="filter-tag"
                :class="{ active: collectionFilter === tag }"
                @click="collectionFilter = tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          
          <div class="collections-grid">
            <div v-for="item in filteredCollections" :key="item.id" class="collection-card">
              <div class="collection-type">
                <span :class="'type-badge ' + item.type">{{ item.typeText }}</span>
                <button class="uncollect-btn" @click="removeCollection(item)" title="取消收藏">
                  ✕
                </button>
              </div>
              <h4 class="collection-title" @click="viewCollection(item)">
                {{ item.title }}
              </h4>
              <p class="collection-desc">{{ item.description }}</p>
              <div class="collection-meta">
                <span>{{ item.author }}</span>
                <span>{{ item.collectTime }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'following' || activeTab === 'followers'" class="follow-panel">
          <div class="panel-header">
            <h3>{{ activeTab === 'following' ? '我的关注' : '我的粉丝' }}</h3>
            <input 
              type="text" 
              v-model="followSearch" 
              placeholder="搜索用户..."
              class="follow-search"
            />
          </div>
          
          <div class="follow-list">
            <div v-for="user in filteredFollows" :key="user.id" class="follow-item">
              <img :src="user.avatar || defaultAvatar" alt="avatar" class="follow-avatar" />
              <div class="follow-info">
                <span class="follow-name">{{ user.nickname }}</span>
                <span class="follow-bio">{{ user.bio || '暂无简介' }}</span>
              </div>
              <button 
                class="follow-action-btn"
                :class="{ following: user.isFollowing }"
                @click="toggleFollowUser(user)"
              >
                {{ user.isFollowing ? '已关注' : '+ 关注' }}
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'settings' && isOwnProfile" class="settings-panel">
          <div class="settings-section">
            <h4>账号设置</h4>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">邮箱</span>
                <span class="setting-value">{{ userInfo.email }}</span>
              </div>
              <button class="setting-btn" @click="changeEmail">修改</button>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">手机号</span>
                <span class="setting-value">{{ userInfo.phone || '未绑定' }}</span>
              </div>
              <button class="setting-btn" @click="bindPhone">
                {{ userInfo.phone ? '修改' : '绑定' }}
              </button>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">密码</span>
                <span class="setting-value">••••••••</span>
              </div>
              <button class="setting-btn" @click="changePassword">修改</button>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>隐私设置</h4>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">公开我的收藏</span>
                <span class="setting-desc">其他人可以看到你的收藏内容</span>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="privacySettings.showCollections" />
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">公开关注列表</span>
                <span class="setting-desc">其他人可以看到你关注的人</span>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="privacySettings.showFollowing" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
          
          <div class="settings-section danger-zone">
            <h4>危险操作</h4>
            <button class="danger-btn" @click="logout">退出登录</button>
            <button class="danger-btn" @click="deleteAccount">注销账号</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="modal-overlay" v-if="showEditModal" @click="closeEditModal">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑资料</h3>
          <button class="close-btn" @click="closeEditModal">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>头像</label>
            <div class="avatar-upload">
              <img :src="editForm.avatar || defaultAvatar" alt="avatar" class="edit-avatar" />
              <button class="upload-btn" @click="uploadAvatar">上传新头像</button>
            </div>
          </div>
          
          <div class="form-group">
            <label>昵称</label>
            <input type="text" v-model="editForm.nickname" placeholder="请输入昵称" />
          </div>
          
          <div class="form-group">
            <label>个人简介</label>
            <textarea v-model="editForm.bio" placeholder="介绍一下自己..." rows="4"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>学院</label>
              <select v-model="editForm.college">
                <option value="">请选择学院</option>
                <option value="地球科学学院">地球科学学院</option>
                <option value="资源学院">资源学院</option>
                <option value="环境学院">环境学院</option>
                <option value="工程学院">工程学院</option>
                <option value="计算机学院">计算机学院</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>专业</label>
              <input type="text" v-model="editForm.major" placeholder="请输入专业" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>年级</label>
              <select v-model="editForm.grade">
                <option value="">请选择年级</option>
                <option value="大一">大一</option>
                <option value="大二">大二</option>
                <option value="大三">大三</option>
                <option value="大四">大四</option>
                <option value="研一">研一</option>
                <option value="研二">研二</option>
                <option value="研三">研三</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>所在地</label>
              <input type="text" v-model="editForm.location" placeholder="请输入所在地" />
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeEditModal">取消</button>
          <button class="save-btn" @click="saveProfile">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import AvatarUpload from '@/components/profile/AvatarUpload.vue'
import CoverUpload from '@/components/profile/CoverUpload.vue'
import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 默认图片
const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23e2e8f0\'/%3E%3Ccircle cx=\'20\' cy=\'15\' r=\'7\' fill=\'%2394a3b8\'/%3E%3Cpath d=\'M8 32 Q20 24, 32 32\' fill=\'%2394a3b8\'/%3E%3C/svg%3E'

// 当前查看的用户ID
const userId = computed(() => {
  const routeId = route.params.id
  if (routeId) return routeId
  const storeUser = userStore.userInfo
  return storeUser?.id || storeUser?._id
})

// 是否是自己的主页
const isOwnProfile = computed(() => {
  if (!userStore.isLoggedIn) return false
  const currentId = userStore.userInfo?.id || userStore.userInfo?._id
  return currentId === userId.value
})

// 用户信息
const userInfo = ref({
  id: '',
  username: '',
  nickname: '',
  avatar: '',
  cover: '',
  bio: '',
  college: '',
  major: '',
  grade: '',
  email: '',
  phone: '',
  location: '',
  verified: false,
  level: 1,
  following: 0,
  followers: 0,
  posts: 0,
  likes: 0
})

// 当前活跃标签页
const activeTab = ref('posts')
const tabs = ref([
  { key: 'posts', label: '帖子', icon: '📝' },
  { key: 'collections', label: '收藏', icon: '⭐' },
  { key: 'following', label: '关注', icon: '👤' },
  { key: 'followers', label: '粉丝', icon: '👥' }
])

// 关注状态
const isFollowing = ref(false)

// 帖子数据
const userPosts = ref([])
const loadingPosts = ref(false)

// 收藏数据
const collections = ref([])

// 关注/粉丝列表
const followList = ref([])
const followSearch = ref('')
const loadingFollow = ref(false)

// 标签计数
const tabCounts = computed(() => ({
  posts: userPosts.value.length,
  collections: collections.value.length,
  following: userInfo.value.following || 0,
  followers: userInfo.value.followers || 0
}))

// 帖子筛选
const postFilter = ref('all')
const showPostFilter = ref(false)

const filteredPosts = computed(() => {
  if (postFilter.value === 'all') return userPosts.value
  return userPosts.value.filter(p => p.status === postFilter.value)
})

const getStatusText = (status) => {
  const statusMap = { published: '已发布', draft: '草稿', archived: '已归档' }
  return statusMap[status] || status
}

// 收藏筛选
const collectionFilter = ref('全部')
const collectionTags = ref(['全部', '帖子', '竞赛', '项目', '问答'])
const showCollectionFilter = ref(false)

const filteredCollections = computed(() => {
  if (collectionFilter.value === '全部') return collections.value
  const typeMap = { '帖子': 'post', '竞赛': 'competition', '项目': 'project', '问答': 'question' }
  return collections.value.filter(c => c.type === typeMap[collectionFilter.value])
})

// 关注/粉丝筛选
const filteredFollows = computed(() => {
  if (!followSearch.value) return followList.value
  return followList.value.filter(u => 
    u.nickname?.includes(followSearch.value) || 
    u.bio?.includes(followSearch.value)
  )
})

// 隐私设置
const privacySettings = ref({
  showCollections: true,
  showFollowing: true
})

// 编辑资料弹窗
const showEditModal = ref(false)
const editForm = ref({
  avatar: '',
  nickname: '',
  bio: '',
  college: '',
  major: '',
  grade: '',
  location: ''
})

// ==========================================
// 加载用户信息
// ==========================================
const loadUserInfo = async () => {
  if (!userId.value) return
  
  try {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    
    const res = await axios.get(`${API_BASE}/users/${userId.value}`, { headers })
    
    userInfo.value = {
      ...userInfo.value,
      ...res.data,
      id: res.data.id || res.data._id
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    // 如果是自己的主页，使用 store 中的数据
    if (isOwnProfile.value && userStore.userInfo) {
      userInfo.value = {
        ...userInfo.value,
        ...userStore.userInfo,
        id: userStore.userInfo.id || userStore.userInfo._id
      }
    }
  }
}

// ==========================================
// 加载用户帖子
// ==========================================
const loadUserPosts = async () => {
  if (!userId.value) return
  
  loadingPosts.value = true
  try {
    const res = await axios.get(`${API_BASE}/posts/user/${userId.value}`)
    userPosts.value = res.data.posts || res.data || []
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    userPosts.value = []
  } finally {
    loadingPosts.value = false
  }
}

// ==========================================
// 加载关注列表
// ==========================================
const loadFollowing = async () => {
  if (!userId.value) return
  
  loadingFollow.value = true
  try {
    const res = await axios.get(`${API_BASE}/users/${userId.value}/following`)
    followList.value = res.data || []
  } catch (error) {
    console.error('获取关注列表失败:', error)
    followList.value = []
  } finally {
    loadingFollow.value = false
  }
}

// ==========================================
// 加载粉丝列表
// ==========================================
const loadFollowers = async () => {
  if (!userId.value) return
  
  loadingFollow.value = true
  try {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await axios.get(`${API_BASE}/users/${userId.value}/followers`, { headers })
    followList.value = res.data || []
  } catch (error) {
    console.error('获取粉丝列表失败:', error)
    followList.value = []
  } finally {
    loadingFollow.value = false
  }
}

// ==========================================
// 关注/取消关注
// ==========================================
const toggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    const res = await axios.post(
      `${API_BASE}/users/${userId.value}/follow`, 
      {}, 
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    isFollowing.value = res.data.isFollowing
    userInfo.value.followers = res.data.followersCount
    
    ElMessage.success(isFollowing.value ? '关注成功' : '已取消关注')
  } catch (error) {
    console.error('关注操作失败:', error)
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

// ==========================================
// 关注/取消关注列表中的用户
// ==========================================
const toggleFollowUser = async (user) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    const res = await axios.post(
      `${API_BASE}/users/${user.id}/follow`, 
      {}, 
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    user.isFollowing = res.data.isFollowing
    
    if (activeTab.value === 'following') {
      loadFollowing()
    } else if (activeTab.value === 'followers') {
      loadFollowers()
    }
    
    ElMessage.success(user.isFollowing ? '关注成功' : '已取消关注')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// ==========================================
// 发送私信
// ==========================================
const sendMessage = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  router.push(`/messages?user=${userId.value}`)
}

// ==========================================
// 处理封面更新
// ==========================================
const handleCoverUpdate = (url) => {
  userInfo.value.cover = url
  if (isOwnProfile.value) {
    userStore.updateUserInfo({ cover: url })
  }
  ElMessage.success('封面已更新')
}

// ==========================================
// 处理头像更新
// ==========================================
const handleAvatarUpdate = (url) => {
  userInfo.value.avatar = url
  if (isOwnProfile.value) {
    userStore.updateUserInfo({ avatar: url })
  }
  ElMessage.success('头像已更新')
}

// ==========================================
// 分享个人主页
// ==========================================
const shareProfile = () => {
  const url = window.location.href
  navigator.clipboard?.writeText(url).then(() => {
    ElMessage.success('个人主页链接已复制')
  }).catch(() => {
    ElMessage.info(`分享链接: ${url}`)
  })
}

// ==========================================
// 打开编辑资料弹窗
// ==========================================
const openEditModal = () => {
  editForm.value = {
    avatar: userInfo.value.avatar,
    nickname: userInfo.value.nickname || '',
    bio: userInfo.value.bio || '',
    college: userInfo.value.college || '',
    major: userInfo.value.major || '',
    grade: userInfo.value.grade || '',
    location: userInfo.value.location || ''
  }
  showEditModal.value = true
}

// ==========================================
// 关闭编辑资料弹窗
// ==========================================
const closeEditModal = () => {
  showEditModal.value = false
}

// ==========================================
// 上传头像（占位）
// ==========================================
const uploadAvatar = () => {
  ElMessage.info('上传头像功能开发中...')
}

// ==========================================
// 保存个人资料
// ==========================================
const saveProfile = async () => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(
      `${API_BASE}/users/profile`, 
      editForm.value,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    userInfo.value = { ...userInfo.value, ...editForm.value }
    userStore.updateUserInfo(editForm.value)
    ElMessage.success('保存成功')
    closeEditModal()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// ==========================================
// 创建新帖子
// ==========================================
const createNewPost = () => {
  router.push('/')
}

// ==========================================
// 查看帖子
// ==========================================
const viewPost = (postId) => {
  router.push(`/post/${postId}`)
}

// ==========================================
// 编辑帖子
// ==========================================
const editPost = () => {
  ElMessage.info('编辑功能开发中...')
}

// ==========================================
// 删除帖子
// ==========================================
const deletePost = (post) => {
  ElMessageBox.confirm('确定要删除这篇帖子吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE}/posts/${post.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      userPosts.value = userPosts.value.filter(p => p.id !== post.id)
      userInfo.value.posts = Math.max(0, (userInfo.value.posts || 1) - 1)
      ElMessage.success('删除成功')
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// ==========================================
// 查看收藏
// ==========================================
const viewCollection = (item) => {
  if (item.type === 'post') {
    router.push(`/post/${item.id}`)
  } else {
    ElMessage.info('查看详情功能开发中...')
  }
}

// ==========================================
// 取消收藏
// ==========================================
const removeCollection = (item) => {
  collections.value = collections.value.filter(c => c.id !== item.id)
  ElMessage.success('已取消收藏')
}

// ==========================================
// 修改邮箱
// ==========================================
const changeEmail = () => {
  ElMessage.info('修改邮箱功能开发中...')
}

// ==========================================
// 绑定手机
// ==========================================
const bindPhone = () => {
  ElMessage.info('绑定手机功能开发中...')
}

// ==========================================
// 修改密码
// ==========================================
const changePassword = () => {
  ElMessage.info('修改密码功能开发中...')
}

// ==========================================
// 退出登录
// ==========================================
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    router.push('/')
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

// ==========================================
// 注销账号
// ==========================================
const deleteAccount = () => {
  ElMessageBox.confirm('注销账号后所有数据将被永久删除，确定要继续吗？', '危险操作', {
    confirmButtonText: '确定注销',
    cancelButtonText: '取消',
    type: 'error'
  }).then(() => {
    ElMessage.success('账号已注销')
    userStore.logout()
    router.push('/')
  }).catch(() => {})
}

// ==========================================
// 监听标签页切换
// ==========================================
watch(activeTab, (newTab) => {
  if (newTab === 'following') {
    loadFollowing()
  } else if (newTab === 'followers') {
    loadFollowers()
  }
})

// ==========================================
// 监听路由变化
// ==========================================
watch(() => route.params.id, () => {
  loadUserInfo()
  loadUserPosts()
  isFollowing.value = false
  activeTab.value = 'posts'
})

// ==========================================
// 初始化
// ==========================================
onMounted(async () => {
  await loadUserInfo()
  await loadUserPosts()
  
  // 如果是自己的主页，添加设置标签
  if (isOwnProfile.value) {
    const hasSettings = tabs.value.find(t => t.key === 'settings')
    if (!hasSettings) {
      tabs.value.push({ key: 'settings', label: '设置', icon: '⚙️' })
    }
  }
})
</script>

<style scoped>
.profile-container {
  max-width: 1000px;
  margin: 0 auto;
}

.profile-header {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
}

.profile-cover {
  position: relative;
  height: 200px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.change-cover-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.2s;
}

.change-cover-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.profile-info {
  padding: 0 24px 24px;
}

.avatar-section {
  margin-top: -40px;
  margin-bottom: 16px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.change-avatar-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.change-avatar-btn:hover {
  background: #f8fafc;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.user-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.user-name {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.user-badge {
  padding: 4px 10px;
  background: #e8f0fe;
  color: #004e9e;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.user-level {
  padding: 4px 10px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 20px;
  font-size: 12px;
}

.user-actions {
  display: flex;
  gap: 12px;
}

.edit-profile-btn,
.share-profile-btn,
.follow-btn,
.message-btn {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-profile-btn,
.share-profile-btn {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.edit-profile-btn:hover,
.share-profile-btn:hover {
  background: #f8fafc;
  border-color: #004e9e;
  color: #004e9e;
}

.follow-btn {
  background: #004e9e;
  border: none;
  color: white;
}

.follow-btn:hover {
  background: #0066cc;
}

.follow-btn.following {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.message-btn {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.message-btn:hover {
  background: #f8fafc;
}

.user-bio {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 16px;
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 14px;
}

.meta-icon {
  font-size: 16px;
}

.user-stats {
  display: flex;
  gap: 32px;
  padding-top: 16px;
  border-top: 1px solid #edf1f7;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: color 0.2s;
}

.stat-item:hover {
  color: #004e9e;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 13px;
  color: #94a3b8;
}

.profile-content {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.content-tabs {
  display: flex;
  border-bottom: 1px solid #edf1f7;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  cursor: pointer;
  color: #64748b;
  font-size: 14px;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-item:hover {
  color: #004e9e;
  background: #f8fafc;
}

.tab-item.active {
  color: #004e9e;
  border-bottom-color: #004e9e;
}

.tab-icon {
  font-size: 18px;
}

.tab-count {
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 12px;
}

.content-panel {
  padding: 24px;
  min-height: 400px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 18px;
  color: #1e293b;
}

.filter-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
}

.post-filter,
.collection-filter {
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #475569;
  background: white;
}

.filter-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tag {
  padding: 6px 14px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tag:hover,
.filter-tag.active {
  background: #004e9e;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.create-post-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: #004e9e;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  cursor: pointer;
}

.post-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  padding: 20px;
  background: #fafbfc;
  border-radius: 12px;
  border: 1px solid #edf1f7;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
}

.post-title:hover {
  color: #004e9e;
}

.post-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.post-preview {
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #94a3b8;
}

.post-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.post-status.published {
  background: #dcfce7;
  color: #16a34a;
}

.post-status.draft {
  background: #fef3c7;
  color: #d97706;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.collection-card {
  padding: 16px;
  background: #fafbfc;
  border-radius: 12px;
  border: 1px solid #edf1f7;
}

.collection-type {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.type-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.type-badge.post {
  background: #e8f0fe;
  color: #004e9e;
}

.type-badge.competition {
  background: #fef3c7;
  color: #d97706;
}

.uncollect-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 50%;
  font-size: 14px;
  color: #94a3b8;
  cursor: pointer;
}

.uncollect-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.collection-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  cursor: pointer;
}

.collection-title:hover {
  color: #004e9e;
}

.collection-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 12px;
}

.collection-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

.follow-search {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  width: 200px;
}

.follow-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.follow-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafbfc;
  border-radius: 12px;
}

.follow-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.follow-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.follow-name {
  font-weight: 600;
  color: #1e293b;
}

.follow-bio {
  font-size: 13px;
  color: #94a3b8;
}

.follow-action-btn {
  padding: 6px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-action-btn:hover {
  border-color: #004e9e;
  color: #004e9e;
}

.follow-action-btn.following {
  background: #004e9e;
  border-color: #004e9e;
  color: white;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section h4 {
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #edf1f7;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-weight: 500;
  color: #1e293b;
}

.setting-value {
  color: #64748b;
  font-size: 14px;
}

.setting-desc {
  font-size: 12px;
  color: #94a3b8;
}

.setting-btn {
  padding: 6px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #004e9e;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.danger-zone {
  margin-top: 32px;
}

.danger-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  margin-right: 12px;
  transition: all 0.2s;
}

.danger-btn:hover {
  background: #fef2f2;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.edit-modal {
  background: white;
  border-radius: 16px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #edf1f7;
}

.modal-header h3 {
  font-size: 18px;
  color: #1e293b;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 50%;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #004e9e;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}

.edit-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}

.upload-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid #edf1f7;
}

.cancel-btn,
.save-btn {
  padding: 10px 24px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.save-btn {
  background: #004e9e;
  border: none;
  color: white;
}
</style>