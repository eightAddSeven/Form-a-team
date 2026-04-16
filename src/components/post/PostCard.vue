<template>
  <div class="post-card" @click="$emit('click', post)">
    <div class="post-header">
      <UserAvatar :size="40" />
      <div class="post-info">
        <div class="author-info">
          <span class="author-name">{{ post.author }}</span>
          <span class="post-time">{{ post.time }}</span>
        </div>
        <h4 class="post-title">{{ post.title }}</h4>
      </div>
    </div>
    
    <div class="post-content">
      <p>{{ post.content }}</p>
    </div>
    
    <div class="post-tags" v-if="post.tags && post.tags.length">
      <span class="tag" v-for="tag in post.tags" :key="tag">{{ tag }}</span>
    </div>
    
    <div class="post-actions">
      <button class="action-btn" @click.stop="$emit('like', post)">
        <span>❤️</span> {{ post.likes || 0 }}
      </button>
      <button class="action-btn" @click.stop="$emit('comment', post)">
        <span>💬</span> {{ post.comments || 0 }}
      </button>
      <button class="action-btn">
        <span>📤</span> 分享
      </button>
    </div>
  </div>
</template>

<script setup>
import UserAvatar from '@/components/common/UserAvatar.vue'

defineProps({
  post: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'like', 'comment'])
</script>

<style scoped>
.post-card {
  padding: 20px;
  border-bottom: 1px solid #f0f3f8;
  cursor: pointer;
  transition: background 0.2s;
}

.post-card:hover {
  background: #fafbfc;
}

.post-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
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
}

.post-time {
  font-size: 12px;
  color: #94a3b8;
}

.post-title {
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 4px;
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
}

.post-actions {
  margin-left: 52px;
  display: flex;
  gap: 20px;
}

.post-actions .action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 20px;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.post-actions .action-btn:hover {
  background: #f1f5f9;
  color: #004e9e;
}
</style>