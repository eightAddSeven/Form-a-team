<template>
  <div class="category-section">
    <h4>
      {{ level }}类竞赛 
      <span class="badge-level">{{ levelName }}</span>
    </h4>
    
    <div class="competition-grid">
      <div class="competition-category" v-for="cat in categories" :key="cat.name">
        <h5>{{ cat.name }}</h5>
        <div class="tag-group">
          <span 
            class="tag" 
            v-for="tag in cat.tags" 
            :key="tag"
            @click="handleTagClick(tag)"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  level: {
    type: String,
    required: true
  },
  levelName: {
    type: String,
    required: true
  },
  categories: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['tagClick'])

const handleTagClick = (tag) => {
  router.push({ path: '/search', query: { tag } })
}
</script>

<style scoped>
.category-section {
  margin-bottom: 28px;
}

.category-section:last-child {
  margin-bottom: 0;
}

.category-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f3f8;
}

.badge-level {
  font-size: 11px;
  padding: 2px 8px;
  background: #e8f0fe;
  color: #004e9e;
  border-radius: 12px;
  font-weight: 400;
}

.competition-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.competition-category h5 {
  font-size: 14px;
  color: #475569;
  margin-bottom: 10px;
  font-weight: 600;
}

.tag-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tag {
  font-size: 13px;
  color: #334155;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag:hover {
  background: #004e9e;
  color: white;
}
</style>