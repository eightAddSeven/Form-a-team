<template>
  <div class="post-list-section">
    <div class="section-header">
      <div class="header-tabs">
        <span 
          v-for="tab in tabs" 
          :key="tab"
          class="tab"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab }}
        </span>
      </div>
      <div class="header-filter">
        <select class="filter-select" v-model="filterType">
          <option value="all">全部帖子</option>
          <option value="competition">竞赛经验</option>
          <option value="research">科研项目</option>
          <option value="team">组队招募</option>
        </select>
      </div>
    </div>
    
    <!-- 帖子列表 -->
    <div class="post-list">
      <div v-if="posts.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <p>暂无帖子，快来发布第一条吧！</p>
      </div>
      
      <div v-else>
        <PostCard 
          v-for="post in posts" 
          :key="post.id"
          :post="post"
          @click="handlePostClick(post)"
          @like="handleLike(post)"
          @comment="handleComment(post)"
        />
      </div>
    </div>
    
    <!-- 加载更多 -->
    <div class="load-more" v-if="hasMore">
      <button class="load-more-btn" @click="$emit('loadMore')">
        加载更多
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PostCard from './PostCard.vue'

defineProps({
  posts: {
    type: Array,
    default: () => []
  },
  hasMore: {
    type: Boolean,
    default: true
  }
})

defineEmits(['loadMore', 'postClick', 'like', 'comment'])

const activeTab = ref('最新')
const filterType = ref('all')
const tabs = ref(['最新', '热门', '关注', '推荐'])

const handlePostClick = (post) => {
  console.log('点击帖子:', post)
}

const handleLike = (post) => {
  console.log('点赞帖子:', post)
}

const handleComment = (post) => {
  console.log('评论帖子:', post)
}
</script>

<style scoped>
.post-list-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf1f7;
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
}

.post-list {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.load-more {
  text-align: center;
  margin-top: 24px;
}

.load-more-btn {
  padding: 10px 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  color: #475569;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover {
  background: #f8fafc;
  border-color: #004e9e;
  color: #004e9e;
}
</style>