<template>
  <div class="messages-page">
    <div class="sidebar">
      <div class="sidebar-header">最近联系</div>
      <div class="conversation-list">
        <div v-if="conversationList.length === 0" class="empty-list">暂无聊天记录</div>
        <div 
          v-for="conv in conversationList" 
          :key="conv._id"
          :class="['conv-item', { active: currentRoomId === conv._id }]"
          @click="selectRoom(conv)"
        >
          <div class="avatar-wrapper">
             <UserAvatar :src="getOpponent(conv.latestMessage).avatar" :size="40" />
             <el-badge v-if="conv.unreadCount > 0" :value="conv.unreadCount" class="badge" />
          </div>
          <div class="conv-info">
            <div class="name-time">
              <span class="name">{{ getOpponent(conv.latestMessage).name }}</span>
              <span class="time">{{ formatTime(conv.latestMessage.createdAt) }}</span>
            </div>
            <div class="preview-text">{{ conv.latestMessage.text }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-main" v-if="currentRoomId">
      <div class="chat-header">
        <span>与 {{ currentOpponentName }} 沟通中</span>
        
        <el-popconfirm 
          title="确定要删除这条聊天记录吗？(对方仍可见)" 
          confirm-button-text="删除"
          cancel-button-text="取消"
          @confirm="deleteConversation"
        >
          <template #reference>
            <el-button type="danger" link>🗑️ 删除聊天</el-button>
          </template>
        </el-popconfirm>
      </div>
      <div class="chat-window" ref="chatWindow">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['message-bubble', String(msg.senderId) === String(userInfo?._id || userInfo?.id) ? 'my-message' : 'other-message']"
        >
          <span class="message-text">{{ msg.text }}</span>
          <span class="msg-time">{{ formatTime(msg.createdAt || msg.timestamp) }}</span>
        </div>
      </div>
      <div class="input-area">
        <el-input v-model="inputText" placeholder="发送消息... (按 Enter 发送)" @keyup.enter="sendMessage" />
        <el-button type="primary" @click="sendMessage">发送</el-button>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <el-empty description="点击左侧列表开始聊天" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { io } from 'socket.io-client'
import { useUserStore } from '@/stores/user'
import API from '@/api'
import UserAvatar from '@/components/common/UserAvatar.vue'

const route = useRoute()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const socket = ref(null)
const conversationList = ref([])
const messages = ref([])
const currentRoomId = ref(null)
const currentOpponent = ref(null)
const inputText = ref('')
const chatWindow = ref(null)

const currentOpponentName = computed(() => currentOpponent.value?.name || '未知')

const generateRoomId = (id1, id2) => {
  return [id1, id2].sort().join('_')
}

// ✅ 核心修复：更健壮的“判断对方身份”逻辑
const getOpponent = (msg) => {
  if (!msg || !userInfo.value) return {}
  
  // 强制转为字符串，并同时兼容 id 和 _id
  const myId = String(userInfo.value._id || userInfo.value.id)
  const senderId = String(msg.senderId)
  
  if (senderId === myId) {
    // 如果消息是我发的，对方就是 receiver
    return { 
      id: msg.receiverId, 
      name: msg.receiverName || '未知用户', 
      avatar: msg.receiverAvatar 
    }
  } else {
    // 如果消息不是我发的，对方就是 sender
    return { 
      id: msg.senderId, 
      name: msg.senderName || '未知用户', 
      avatar: msg.senderAvatar 
    }
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight
  }
}

const loadConversations = async () => {
  try {
    const res = await API.get('/messages/conversations')
    conversationList.value = res.data
  } catch (e) {
    console.error('加载会话列表失败', e)
  }
}

const selectRoom = async (conv) => {
  currentRoomId.value = conv._id
  currentOpponent.value = getOpponent(conv.latestMessage)
  
  if (conv.unreadCount > 0) {
    conv.unreadCount = 0
    await API.put(`/messages/read/${conv._id}`)
  }
  
  try {
    const res = await API.get(`/messages/${conv._id}`)
    messages.value = res.data
    scrollToBottom()
  } catch (error) {
    console.error('获取历史记录失败', error)
  }

  if (socket.value) socket.value.emit('join_room', conv._id)
}

onMounted(async () => {
  await loadConversations()

  const { targetId, targetName, targetAvatar } = route.query
  if (targetId && userInfo.value) {
    const roomId = generateRoomId(userInfo.value._id || userInfo.value.id, targetId)
    const existingConv = conversationList.value.find(c => c._id === roomId)
    
    if (existingConv) {
      selectRoom(existingConv)
    } else {
      const virtualConv = {
        _id: roomId,
        latestMessage: {
          senderId: userInfo.value._id || userInfo.value.id,
          senderName: userInfo.value.nickname || userInfo.value.username,
          senderAvatar: userInfo.value.avatar,
          receiverId: targetId,
          receiverName: targetName,
          receiverAvatar: targetAvatar,
          text: '打个招呼吧...',
          createdAt: new Date().toISOString()
        },
        unreadCount: 0
      }
      conversationList.value.unshift(virtualConv)
      selectRoom(virtualConv)
    }
  }

  socket.value = io('http://localhost:3000')
  
  socket.value.on('connect', () => {
    if (userInfo.value) {
      socket.value.emit('join_global', userInfo.value._id || userInfo.value.id)
    }
  })

  socket.value.on('receive_message', (data) => {
    if (data.roomId === currentRoomId.value) {
      const myId = String(userInfo.value._id || userInfo.value.id)
      const isMyMessage = String(data.senderId) === myId
      
      if (!isMyMessage) {
        messages.value.push(data)
        scrollToBottom()
        API.put(`/messages/read/${data.roomId}`)
      }
    }
    loadConversations() 
  })
})

const sendMessage = () => {
  if (!inputText.value.trim() || !currentRoomId.value || !currentOpponent.value) return

  const messageData = {
    roomId: currentRoomId.value,
    senderId: userInfo.value._id || userInfo.value.id,
    senderName: userInfo.value.nickname || userInfo.value.username || '未知',
    senderAvatar: userInfo.value.avatar,
    receiverId: currentOpponent.value.id,
    receiverName: currentOpponent.value.name,
    receiverAvatar: currentOpponent.value.avatar,
    text: inputText.value,
    isRead: false,
    timestamp: Date.now()
  }

  socket.value.emit('send_message', messageData)
  
  messages.value.push({ ...messageData, createdAt: new Date() })
  scrollToBottom()
  
  inputText.value = ''
  loadConversations()
}

// ✅ 新增：删除当前聊天会话
const deleteConversation = async () => {
  if (!currentRoomId.value) return
  
  try {
    // 请求后端软删除
    await API.delete(`/messages/${currentRoomId.value}`)
    
    // 清空当前右侧的聊天界面状态
    currentRoomId.value = null
    currentOpponent.value = null
    messages.value = []
    
    // 重新加载左侧列表（此时被删的聊天因为聚合查询过滤，会自动消失）
    await loadConversations()
    
    // 如果左侧还有其他聊天，自动选中第一个
    if (conversationList.value.length > 0) {
      selectRoom(conversationList.value[0])
    }
  } catch (error) {
    console.error('删除聊天记录失败', error)
  }
}

onUnmounted(() => {
  if (socket.value) socket.value.disconnect()
})
</script>

<style scoped>
.messages-page {
  display: flex;
  height: 650px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  overflow: hidden;
}

.sidebar {
  width: 300px;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  font-weight: bold;
  font-size: 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.empty-list {
  text-align: center;
  color: #909399;
  padding: 20px;
  font-size: 14px;
}

.conv-item {
  display: flex;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f2f6fc;
}

.conv-item:hover { background: #f5f7fa; }
.conv-item.active { background: #ecf5ff; }

.avatar-wrapper { position: relative; margin-right: 12px; }
.badge { position: absolute; top: -5px; right: -5px; z-index: 1; }

.conv-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }
.name-time { display: flex; justify-content: space-between; margin-bottom: 4px; }
.name { font-weight: 500; color: #303133; font-size: 14px; }
.time { font-size: 12px; color: #909399; }
.preview-text { font-size: 13px; color: #606266; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chat-main { flex: 1; display: flex; flex-direction: column; }
.chat-header { padding: 16px; border-bottom: 1px solid #ebeef5; font-weight: bold; font-size: 16px; }

.chat-window {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 8px;
  max-width: 60%;
  word-break: break-all;
  display: flex;
  flex-direction: column;
}

.my-message {
  background: #409eff;
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 2px;
}

.other-message {
  background: white;
  border: 1px solid #e4e7ed;
  align-self: flex-start;
  border-bottom-left-radius: 2px;
  color: #303133;
}

.msg-time { font-size: 11px; margin-top: 4px; opacity: 0.7; align-self: flex-end; }
.input-area { padding: 16px; border-top: 1px solid #ebeef5; display: flex; gap: 12px; background: white; }
.empty-state { flex: 1; display: flex; align-items: center; justify-content: center; }
</style>