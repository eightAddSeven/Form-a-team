<template>
  <div class="competitions-page">
    <div class="page-header">
      <h2>🏆 学术竞赛</h2>
      <p class="page-desc">浏览各类学科竞赛，寻找队友或分享经验</p>
    </div>

    <!-- 热门竞赛标签 -->
    <div class="hot-tags-section">
      <h3>🔥 热门竞赛</h3>
      <div class="hot-tags-list">
        <span 
          v-for="tag in hotCompetitionTags" 
          :key="tag.name"
          class="hot-tag"
          @click="searchByTag(tag.name)"
        >
          {{ tag.displayName }} <span class="tag-count">{{ tag.count }}</span>
        </span>
      </div>
    </div>

    <!-- 按类别展示所有竞赛标签 -->
    <div class="categories-section">
      <div v-for="category in categories" :key="category.name" class="category-group">
        <div class="category-header" @click="toggleCategory(category.name)">
          <span class="category-icon">{{ category.icon }}</span>
          <h3>{{ category.label }}</h3>
          <span class="toggle-icon">{{ expandedCategories.includes(category.name) ? '▼' : '▶' }}</span>
        </div>
        <div v-show="expandedCategories.includes(category.name)" class="category-tags">
          <div v-for="type in category.types" :key="type" class="type-group">
            <h4>{{ type }}</h4>
            <div class="tags-grid">
              <span 
                v-for="tag in getTagsByCategoryAndType(category.name, type)" 
                :key="tag.name"
                class="competition-tag"
                @click="searchByTag(tag.name)"
              >
                {{ tag.displayName }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTagStore } from '@/stores/tagStore'
import { searchAPI } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const tagStore = useTagStore()

// 热门标签数据（可从后端获取，此处使用静态演示）
const hotCompetitionTags = ref([
  { name: '数学建模国赛', displayName: '数学建模国赛', count: 156 },
  { name: '挑战杯创业赛', displayName: '挑战杯创业赛', count: 98 },
  { name: 'ACM程序设计', displayName: 'ACM程序设计', count: 87 },
  { name: '节能减排大赛', displayName: '节能减排大赛', count: 64 },
  { name: '英语演讲比赛', displayName: '英语演讲比赛', count: 52 },
  { name: '结构设计大赛', displayName: '结构设计大赛', count: 43 }
])

// 分类定义
const categories = [
  { name: 'A', label: 'A 类竞赛', icon: '🥇' },
  { name: 'B', label: 'B 类竞赛', icon: '🥈' },
  { name: 'C', label: 'C 类竞赛', icon: '🥉' }
]

// 展开的分类
const expandedCategories = ref(['A']) // 默认展开A类

// 切换分类展开/折叠
const toggleCategory = (catName) => {
  const index = expandedCategories.value.indexOf(catName)
  if (index > -1) {
    expandedCategories.value.splice(index, 1)
  } else {
    expandedCategories.value.push(catName)
  }
}

// 从 store 获取竞赛标签
const competitionTags = computed(() => tagStore.competitionTags)

// 获取特定分类下的所有类型
const getTypesByCategory = (category) => {
  const tags = competitionTags.value.filter(t => t.category === category)
  const types = [...new Set(tags.map(t => t.type))]
  return types.sort()
}

// 获取指定分类和类型的标签
const getTagsByCategoryAndType = (category, type) => {
  return competitionTags.value.filter(t => t.category === category && t.type === type)
}

// 按标签搜索
const searchByTag = (tagName) => {
  router.push({ path: '/search', query: { tag: tagName } })
}

// 可选：从后端获取热门标签实际使用次数
const fetchHotTags = async () => {
  try {
    const res = await searchAPI.getHotTags()
    // 可以过滤只显示竞赛类标签
    // hotCompetitionTags.value = res.data.filter(t => t.source === 'competition')
  } catch (error) {
    console.error('获取热门标签失败', error)
  }
}

onMounted(() => {
  // fetchHotTags()
})
</script>

<style scoped>
.competitions-page {
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
  background: linear-gradient(135deg, #fff5f5, #fff);
  border: 1px solid #fed7d7;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 500;
  color: #c53030;
  cursor: pointer;
  transition: all 0.2s;
}

.hot-tag:hover {
  background: #c53030;
  color: white;
  border-color: #c53030;
}

.hot-tag .tag-count {
  background: rgba(0,0,0,0.05);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
}

.categories-section {
  background: white;
  border-radius: 16px;
  padding: 8px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #edf1f7;
  overflow: hidden;
}

.category-group {
  border-bottom: 1px solid #edf1f7;
}

.category-group:last-child {
  border-bottom: none;
}

.category-header {
  display: flex;
  align-items: center;
  padding: 18px 24px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.category-header:hover {
  background: #f8fafc;
}

.category-icon {
  font-size: 24px;
  margin-right: 12px;
}

.category-header h3 {
  flex: 1;
  font-size: 18px;
  color: #1e293b;
}

.toggle-icon {
  color: #94a3b8;
  font-size: 14px;
}

.category-tags {
  padding: 0 24px 24px 60px;
  background: #fafbfc;
}

.type-group {
  margin-bottom: 20px;
}

.type-group h4 {
  font-size: 15px;
  color: #475569;
  margin-bottom: 12px;
  font-weight: 500;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.competition-tag {
  padding: 6px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.competition-tag:hover {
  background: #004e9e;
  color: white;
  border-color: #004e9e;
}

@media (max-width: 768px) {
  .competitions-page {
    padding: 16px;
  }
  
  .category-tags {
    padding: 0 16px 16px 40px;
  }
}
</style>