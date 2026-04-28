<template>
  <div class="research-page">
    <div class="page-header">
      <h2>🔬 科研立项</h2>
      <p class="page-desc">浏览各学院研究方向，寻找合作伙伴</p>
    </div>

    <!-- 热门研究方向 -->
    <div class="hot-tags-section">
      <h3>🔥 热门方向</h3>
      <div class="hot-tags-list">
        <span 
          v-for="tag in hotResearchTags" 
          :key="tag.name"
          class="hot-tag"
          @click="searchByTag(tag.name)"
        >
          {{ tag.displayName }} <span class="tag-count">{{ tag.count }}</span>
        </span>
      </div>
    </div>

    <!-- 按学院分类展示 -->
    <div class="colleges-section">
      <div v-for="college in colleges" :key="college" class="college-group">
        <div class="college-header" @click="toggleCollege(college)">
          <span class="college-icon">🏛️</span>
          <h3>{{ college }}</h3>
          <span class="toggle-icon">{{ expandedColleges.includes(college) ? '▼' : '▶' }}</span>
        </div>
        <div v-show="expandedColleges.includes(college)" class="college-tags">
          <div class="tags-grid">
            <span 
              v-for="tag in getTagsByCollege(college)" 
              :key="tag.name"
              class="research-tag"
              @click="searchByTag(tag.name)"
            >
              {{ tag.displayName }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTagStore } from '@/stores/tagStore'

const router = useRouter()
const tagStore = useTagStore()

// 热门科研标签（静态示例，可后续从后端获取）
const hotResearchTags = ref([
  { name: '地质过程与矿产资源', displayName: '地质过程与矿产资源', count: 89 },
  { name: '环境科学与工程', displayName: '环境科学与工程', count: 76 },
  { name: '计算机应用技术', displayName: '计算机应用技术', count: 65 },
  { name: '材料科学与工程', displayName: '材料科学与工程', count: 54 },
  { name: '岩土工程', displayName: '岩土工程', count: 42 }
])

// 所有学院列表
const colleges = computed(() => {
  const collegeSet = new Set(tagStore.researchTags.map(t => t.college))
  return Array.from(collegeSet).sort()
})

// 展开的学院
const expandedColleges = ref(['地球科学学院']) // 默认展开第一个

const toggleCollege = (college) => {
  const index = expandedColleges.value.indexOf(college)
  if (index > -1) {
    expandedColleges.value.splice(index, 1)
  } else {
    expandedColleges.value.push(college)
  }
}

const getTagsByCollege = (college) => {
  return tagStore.researchTags.filter(t => t.college === college)
}

const searchByTag = (tagName) => {
  router.push({ path: '/search', query: { tag: tagName } })
}
</script>

<style scoped>
.research-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 28px;
  color: #1e293b;
  margin-bottom: 8px;
}

.page-desc {
  color: #64748b;
  font-size: 15px;
}

.hot-tags-section {
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf1f7;
}

.hot-tags-section h3 {
  font-size: 18px;
  color: #1e293b;
  margin-bottom: 16px;
}

.hot-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hot-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: linear-gradient(135deg, #f0fdf4, #fff);
  border: 1px solid #bbf7d0;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 500;
  color: #166534;
  cursor: pointer;
  transition: all 0.2s;
}

.hot-tag:hover {
  background: #166534;
  color: white;
  border-color: #166534;
}

.hot-tag .tag-count {
  background: rgba(0,0,0,0.05);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
}

.colleges-section {
  background: white;
  border-radius: 16px;
  padding: 8px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf1f7;
  overflow: hidden;
}

.college-group {
  border-bottom: 1px solid #edf1f7;
}

.college-group:last-child {
  border-bottom: none;
}

.college-header {
  display: flex;
  align-items: center;
  padding: 18px 24px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.college-header:hover {
  background: #f8fafc;
}

.college-icon {
  font-size: 24px;
  margin-right: 12px;
}

.college-header h3 {
  flex: 1;
  font-size: 18px;
  color: #1e293b;
}

.toggle-icon {
  color: #94a3b8;
  font-size: 14px;
}

.college-tags {
  padding: 0 24px 24px 60px;
  background: #fafbfc;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.research-tag {
  padding: 6px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.research-tag:hover {
  background: #004e9e;
  color: white;
  border-color: #004e9e;
}

@media (max-width: 768px) {
  .research-page {
    padding: 16px;
  }
  
  .college-tags {
    padding: 0 16px 16px 40px;
  }
}
</style>