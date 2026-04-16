<template>
  <div class="hot-item" @click="$emit('click')">
    <span class="hot-rank" :class="{ 'top-three': rank <= 3 }">
      {{ rank }}
    </span>
    
    <div class="hot-content">
      <span class="hot-title">{{ item.title }}</span>
      <span class="hot-heat">{{ formatHeat(item.heat) }}</span>
    </div>
    
    <span class="hot-tag" v-if="item.tag" :class="getTagClass(item.tag)">
      {{ item.tag }}
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  rank: {
    type: Number,
    required: true
  }
})

defineEmits(['click'])

const formatHeat = (heat) => {
  if (typeof heat === 'number') {
    return heat > 10000 ? `${(heat / 10000).toFixed(1)}w` : heat
  }
  return heat
}

const getTagClass = (tag) => {
  const tagMap = {
    '热': 'tag-hot',
    '新': 'tag-new',
    '荐': 'tag-rec'
  }
  return tagMap[tag] || ''
}
</script>

<style scoped>
.hot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.hot-item:hover {
  transform: translateX(4px);
}

.hot-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  flex-shrink: 0;
}

.hot-rank.top-three {
  color: #f23d4d;
  font-weight: 700;
}

.hot-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hot-title {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.hot-heat {
  font-size: 12px;
  color: #94a3b8;
}

.hot-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.hot-tag.tag-hot {
  background: #fef3c7;
  color: #d97706;
}

.hot-tag.tag-new {
  background: #dcfce7;
  color: #16a34a;
}

.hot-tag.tag-rec {
  background: #e0e7ff;
  color: #4f46e5;
}
</style>