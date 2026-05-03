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
import { ElMessage } from 'element-plus'  // 新增，用于显示禁言等错误提示

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

const getOpponent = (msg) => {
  if (!msg || !userInfo.value) return {}
  const myId = String(userInfo.value._id || userInfo.value.id)
  const senderId = String(msg.senderId)
  
  if (senderId === myId) {
    return { 
      id: msg.receiverId, 
      name: msg.receiverName || '未知用户', 
      avatar: msg.receiverAvatar 
    }
  } else {
    return { 
      id: msg.senderId, 
      name: msg.senderName || '未知用户', 
      avatar: msg.senderAvatar 
    }
  }
}

// ✅ 修复：人性化的聊天时间分级格式化
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  
  // 提取时分 (HH:mm)
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  // 1. 判断是否是今天 (仅返回 09:00)
  if (date.toDateString() === now.toDateString()) {
    return timeStr;
  }
  
  // 2. 判断是否是昨天 (返回 昨天 09:00)
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${timeStr}`;
  }
  
  // 提取月和日
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // 3. 判断是否是今年 (返回 05-01 09:00)
  if (date.getFullYear() === now.getFullYear()) {
    return `${month}-${day} ${timeStr}`;
  }
  
  // 4. 跨年历史消息 (返回 2025-12-31 09:00)
  const year = date.getFullYear();
  return `${year}-${month}-${day} ${timeStr}`;
};

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

  socket.value.on('new_unread_message', () => {
    loadConversations()
  })
})

const sendMessage = () => {
  if (!inputText.value.trim() || !currentRoomId.value || !currentOpponent.value) return

  // 生成临时ID，用于后续移除
  const tempId = 'temp_' + Date.now() + Math.random()
  const myId = userInfo.value._id || userInfo.value.id

  const messageData = {
    roomId: currentRoomId.value,
    senderId: myId,
    senderName: userInfo.value.nickname || userInfo.value.username || '未知',
    senderAvatar: userInfo.value.avatar,
    receiverId: currentOpponent.value.id,
    receiverName: currentOpponent.value.name,
    receiverAvatar: currentOpponent.value.avatar,
    text: inputText.value,
    isRead: false,
    timestamp: Date.now(),
    _tempId: tempId   // 携带临时ID，方便后端返回时匹配？
  }

  // 乐观更新：临时添加到列表
  const tempMsg = { ...messageData, createdAt: new Date() }
  messages.value.push(tempMsg)
  scrollToBottom()
  inputText.value = ''

  // 发送消息，使用回调处理结果
  socket.value.emit('send_message', messageData, (response) => {
    if (response && response.error) {
      // 发送失败，移除临时消息
      messages.value = messages.value.filter(m => m._tempId !== tempId)
      ElMessage.error(response.error)
    } else {
      // 发送成功，移除临时标记（可选）
      const msg = messages.value.find(m => m._tempId === tempId)
      if (msg) {
        delete msg._tempId
        delete msg.pending
      }
      loadConversations() // 刷新左侧最近消息
    }
  })
}

const deleteConversation = async () => {
  if (!currentRoomId.value) return
  
  try {
    await API.delete(`/messages/${currentRoomId.value}`)
    
    currentRoomId.value = null
    currentOpponent.value = null
    messages.value = []
    
    await loadConversations()
    
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