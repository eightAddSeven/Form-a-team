<template>
  <div class="admin-dashboard">
    <!-- 可爱标题区 -->
    <div class="cute-header">
      <div class="header-content">
        <span class="cute-icon">🐱</span>
        <h2>管理员后台</h2>
        <span class="cute-icon">🌸</span>
      </div>
      <p class="header-sub">用户管理 · 禁言 · 删除 · 敏感词</p>
    </div>

    <!-- 标签切换 -->
    <div class="content-tabs">
      <span
        class="tab-item"
        :class="{ active: adminTab === 'users' }"
        @click="adminTab = 'users'"
      >
        👥 用户管理
      </span>
      <span
        class="tab-item"
        :class="{ active: adminTab === 'keywords' }"
        @click="adminTab = 'keywords'; fetchKeywords()"
      >
        🚫 敏感词管理
      </span>
    </div>

    <!-- ========== 用户管理面板 ========== -->
    <div v-if="adminTab === 'users'">
      <!-- 搜索框 -->
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索用户名..."
          class="search-input"
        />
        <button v-if="searchKeyword" class="clear-search-btn" @click="searchKeyword = ''">
          ✕
        </button>
      </div>

      <!-- 用户卡片列表区 -->
      <div class="user-cards-container">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载用户列表中...</p>
        </div>

        <div v-else class="user-cards">
          <div
            v-for="user in filteredUsers"
            :key="user._id"
            class="user-card"
            :class="{ 'is-banned': isBanned(user) }"
          >
            <div class="card-avatar">
              <img
                :src="user.avatar || defaultAvatar"
                alt="avatar"
                class="avatar-img"
              />
              <span v-if="user.role === 'admin'" class="admin-badge" title="管理员">👑</span>
            </div>

            <div class="card-info">
              <div class="info-name">
                {{ user.username || user.nickname || '未设置用户名' }}
                <span v-if="user.role === 'admin'" class="role-tag">管理员</span>
              </div>
              <div class="info-email">{{ user.email || '未填写邮箱' }}</div>
              <div class="info-status">
                <span v-if="isBanned(user)" class="banned-tag">禁言中</span>
                <span v-else class="active-tag">正常</span>
              </div>
            </div>

            <div class="card-actions">
              <button
                class="cute-btn ban-btn"
                :disabled="user._id === currentUserId"
                @click="openBanDialog(user)"
              >
                禁言
              </button>
              <button
                v-if="isBanned(user)"
                class="cute-btn unban-btn"
                @click="unbanUser(user)"
              >
                解除禁言
              </button>
              <button
                class="cute-btn delete-btn"
                :disabled="user._id === currentUserId"
                @click="deleteUser(user)"
              >
                删除
              </button>
            </div>
          </div>

          <div v-if="filteredUsers.length === 0 && !loading" class="empty-state">
            <span class="empty-icon">🌱</span>
            <p>暂无匹配的用户</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 敏感词管理面板 ========== -->
    <div v-if="adminTab === 'keywords'" class="keywords-panel">
      <div class="search-bar">
        <input
          v-model="newKeyword"
          placeholder="输入敏感词，按回车添加"
          class="search-input"
          @keyup.enter="addKeyword"
        />
        <button class="cute-btn add-keyword-btn" @click="addKeyword">添加</button>
      </div>

      <div class="keyword-list">
        <span v-for="kw in keywords" :key="kw._id" class="keyword-tag">
          {{ kw.word }}
          <button class="delete-kw-btn" @click="deleteKeyword(kw._id)">✕</button>
        </span>
        <div v-if="keywords.length === 0" class="empty-state">
          <span class="empty-icon">🏷️</span>
          <p>暂无敏感词，快来添加吧</p>
        </div>
      </div>
    </div>

    <!-- 禁言弹窗 -->
    <div v-if="banDialogVisible" class="cute-modal-overlay" @click.self="banDialogVisible = false">
      <div class="cute-modal">
        <div class="modal-header">
          <span class="modal-icon">🔇</span>
          <h3>禁言用户</h3>
        </div>
        <div class="modal-body">
          <p>
            设置对 <strong>{{ banTarget?.nickname || banTarget?.username || '未知用户' }}</strong> 的禁言时长：
          </p>
          <div class="sleep-options">
            <button
              v-for="opt in banOptions"
              :key="opt.value"
              class="sleep-option"
              :class="{ active: banDays === opt.value }"
              @click="banDays = opt.value"
            >
              <span class="option-icon">{{ opt.icon }}</span>
              <span class="option-label">{{ opt.label }}</span>
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cute-btn cancel-btn" @click="banDialogVisible = false">取消</button>
          <button class="cute-btn confirm-btn" @click="confirmBan" :disabled="banLoading">
            {{ banLoading ? '处理中...' : '确认禁言' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { adminAPI } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

if (!userStore.isAdmin) {
  router.replace('/')
}

const currentUserId = userStore.userInfo?._id || userStore.userInfo?.id

// 标签切换
const adminTab = ref('users')

// 用户管理相关
const users = ref([])
const loading = ref(true)
const searchKeyword = ref('')

const banDialogVisible = ref(false)
const banTarget = ref(null)
const banDays = ref(1)
const banLoading = ref(false)

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23e3f2fd\'/%3E%3Ccircle cx=\'20\' cy=\'15\' r=\'7\' fill=\'%2390caf9\'/%3E%3Cpath d=\'M8 32 Q20 24, 32 32\' fill=\'%2390caf9\'/%3E%3C/svg%3E'

const banOptions = [
  { value: 1, label: '1 天', icon: '🌙' },
  { value: 3, label: '3 天', icon: '⭐' },
  { value: 7, label: '7 天', icon: '💤' },
  { value: 30, label: '30 天', icon: '🛌' }
]

const filteredUsers = computed(() => {
  if (!searchKeyword.value.trim()) return users.value
  return users.value.filter(user =>
    (user.username || '').toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const isBanned = (user) => {
  return user.bannedUntil && new Date(user.bannedUntil) > new Date()
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await adminAPI.getUsers()
    users.value = res.data || []
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const openBanDialog = (user) => {
  banTarget.value = user
  banDays.value = 1
  banDialogVisible.value = true
}

const confirmBan = async () => {
  if (!banTarget.value) return
  banLoading.value = true
  try {
    await adminAPI.banUser(banTarget.value._id, banDays.value)
    ElMessage.success(`已禁言用户 ${banTarget.value.nickname || banTarget.value.username}`)
    banDialogVisible.value = false
    await fetchUsers()
  } catch (error) {
    console.error('禁言失败:', error)
    ElMessage.error(error.response?.data?.message || '禁言失败')
  } finally {
    banLoading.value = false
  }
}

const unbanUser = async (user) => {
  try {
    await adminAPI.unbanUser(user._id)
    ElMessage.success(`已解除对 ${user.nickname || user.username} 的禁言`)
    await fetchUsers()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '解除禁言失败')
  }
}

const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要永久删除用户「${user.nickname || user.username || '未知用户'}」吗？此操作不可恢复。`,
      '危险操作',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    await adminAPI.deleteUser(user._id)
    ElMessage.success('用户已删除')
    await fetchUsers()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除用户失败:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 敏感词管理相关
const keywords = ref([])
const newKeyword = ref('')

const fetchKeywords = async () => {
  try {
    const res = await adminAPI.getKeywords()
    keywords.value = res.data || []
  } catch (error) {
    console.error('获取敏感词失败:', error)
  }
}

const addKeyword = async () => {
  if (!newKeyword.value.trim()) return
  try {
    await adminAPI.addKeyword(newKeyword.value.trim())
    newKeyword.value = ''
    await fetchKeywords()
    ElMessage.success('敏感词已添加')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '添加失败')
  }
}

const deleteKeyword = async (id) => {
  try {
    await adminAPI.deleteKeyword(id)
    await fetchKeywords()
    ElMessage.success('已删除')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

/* 可爱标题 */
.cute-header {
  text-align: center;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.cute-icon {
  font-size: 28px;
}

.header-content h2 {
  font-size: 26px;
  font-weight: 700;
  color: #4a90e2;
  margin: 0;
}

.header-sub {
  font-size: 14px;
  color: #78909c;
  margin-top: 8px;
}

/* 标签切换 */
.content-tabs {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 20px;
}

.tab-item {
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 600;
  color: #78909c;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s;
}

.tab-item:hover {
  background: #e3f2fd;
  color: #1976d2;
}

.tab-item.active {
  background: #1976d2;
  color: white;
}

/* 搜索框 */
.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 24px;
  padding: 8px 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
  border: 1px solid #bbdefb;
}

.search-icon {
  font-size: 16px;
  margin-right: 8px;
  color: #90a4ae;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #37474f;
  outline: none;
}

.search-input::placeholder {
  color: #90a4ae;
}

.clear-search-btn {
  background: #bbdefb;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  color: #1e3a5f;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 用户卡片容器 */
.user-cards-container {
  min-height: 300px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #90a4ae;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #bbdefb;
  border-top-color: #4a90e2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 用户卡片 */
.user-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.08);
  border: 1px solid #bbdefb;
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.15);
}

.user-card.is-banned {
  background: #fff3e0;
  border-color: #ffcc80;
}

.card-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e3f2fd;
  object-fit: cover;
}

.admin-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 18px;
  filter: drop-shadow(0 0 4px gold);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.info-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e3a5f;
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
}

.info-email {
  font-size: 13px;
  color: #546e7a;
  margin-top: 4px;
}

.info-status {
  margin-top: 4px;
}

.banned-tag {
  font-size: 12px;
  color: #ef6c00;
  background: #ffe0b2;
  padding: 2px 10px;
  border-radius: 10px;
}

.active-tag {
  font-size: 12px;
  color: #2e7d32;
  background: #c8e6c9;
  padding: 2px 10px;
  border-radius: 10px;
}

/* 卡片操作按钮 */
.card-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.cute-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.cute-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ban-btn {
  background: #42a5f5;
}
.ban-btn:hover:not(:disabled) {
  background: #1e88e5;
}

.unban-btn {
  background: #66bb6a;
}
.unban-btn:hover:not(:disabled) {
  background: #43a047;
}

.delete-btn {
  background: #ef5350;
}
.delete-btn:hover:not(:disabled) {
  background: #e53935;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #90a4ae;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  display: block;
}

/* 敏感词面板 */
.keywords-panel {
  min-height: 200px;
}

.add-keyword-btn {
  background: #1976d2;
  margin-left: 12px;
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.keyword-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #e3f2fd;
  color: #1565c0;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.delete-kw-btn {
  background: none;
  border: none;
  color: #ef5350;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

/* 禁言弹窗 */
.cute-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(200, 220, 240, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cute-modal {
  background: white;
  border-radius: 24px;
  padding: 28px;
  width: 380px;
  box-shadow: 0 10px 40px rgba(74, 144, 226, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.modal-icon {
  font-size: 28px;
}

.modal-header h3 {
  font-size: 18px;
  color: #1e3a5f;
  margin: 0;
}

.modal-body p {
  font-size: 14px;
  color: #455a64;
  margin-bottom: 16px;
}

.sleep-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.sleep-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: #f5f9ff;
  border: 2px solid #e3f2fd;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.sleep-option:hover {
  background: #e3f2fd;
}

.sleep-option.active {
  border-color: #1976d2;
  background: #e3f2fd;
}

.option-icon {
  font-size: 20px;
}

.option-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e3a5f;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn {
  background: #e3f2fd;
  color: #1e3a5f;
}

.cancel-btn:hover {
  background: #bbdefb;
}

.confirm-btn {
  background: #1976d2;
}

.confirm-btn:hover:not(:disabled) {
  background: #1565c0;
}
</style>