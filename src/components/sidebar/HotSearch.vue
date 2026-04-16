<template>
  <div class="hot-search-card">
    <div class="card-header">
      <h3>
        <span class="icon">🔥</span>
        热搜榜
      </h3>
      <span class="update-time">{{ updateTime }}</span>
    </div>
    
    <div class="hot-search-list">
      <HotSearchItem 
        v-for="(item, index) in items" 
        :key="item.id || index"
        :item="item"
        :rank="index + 1"
        @click="handleItemClick(item)"
      />
    </div>
    
    <div class="card-footer">
      <a href="#" class="more-link" @click.prevent="handleViewMore">
        查看更多热搜 >
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import HotSearchItem from './HotSearchItem.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['itemClick', 'viewMore'])

const updateTime = computed(() => {
  const now = new Date()
  return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} 更新`
})

const handleItemClick = (item) => {
  emit('itemClick', item)
}

const handleViewMore = () => {
  emit('viewMore')
}
</script>

<style scoped>
.hot-search-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf1f7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f3f8;
}

.card-header h3 {
  font-size: 18px;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon {
  font-size: 20px;
}

.update-time {
  font-size: 12px;
  color: #94a3b8;
}

.hot-search-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #edf1f7;
  text-align: center;
}

.more-link {
  color: #004e9e;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.more-link:hover {
  text-decoration: underline;
}
</style>