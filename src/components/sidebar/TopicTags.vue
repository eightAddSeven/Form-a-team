<template>
  <div class="side-card">
    <h4>📊 本周热门话题</h4>
    <div class="topic-tags">
      <span 
        class="topic-tag" 
        v-for="tag in tags" 
        :key="tag"
        @click="handleTagClick(tag)"
      >
        #{{ tag }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['tagClick'])

const handleTagClick = (tag) => {
  emit('tagClick', tag)
}
</script>

<style scoped>
.side-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf1f7;
}

.side-card h4 {
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 16px;
}

.topic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-tag {
  padding: 6px 12px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.topic-tag:hover {
  background: #004e9e;
  color: white;
}
</style>