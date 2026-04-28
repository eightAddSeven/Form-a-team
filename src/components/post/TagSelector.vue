<template>
  <div class="tag-selector" ref="selectorRef">
    <!-- 已选标签 -->
    <div class="selected-tags" v-if="selectedTags.length > 0">
      <span 
        v-for="tag in selectedTags" 
        :key="tag.displayName || tag.name"
        class="selected-tag"
      >
        <span class="tag-source" :class="tag.source">
          {{ tag.source === 'competition' ? '🏆' : tag.source === 'research' ? '🔬' : '📌' }}
        </span>
        {{ tag.displayName || tag.name }}
        <button @click.stop="removeTag(tag)" class="remove-tag">✕</button>
      </span>
    </div>
    
    <!-- 输入框 -->
    <div class="tag-input-wrapper">
      <input 
        type="text" 
        v-model="searchKeyword"
        placeholder="搜索或选择标签..."
        class="tag-input"
        @focus="openDropdown"
        @click.stop="openDropdown"
      />
      <button class="clear-btn" v-if="searchKeyword" @click.stop="searchKeyword = ''">✕</button>
    </div>
    
    <!-- 下拉面板 - 使用 Teleport 传送到 body，避免被遮挡 -->
    <Teleport to="body">
      <div 
        v-if="showDropdown" 
        class="tag-dropdown-overlay"
        @click="showDropdown = false"
      >
        <div 
          class="tag-dropdown" 
          :style="dropdownStyle"
          @click.stop
          @wheel.stop
        >
          <!-- Tab 切换 -->
          <div class="dropdown-tabs">
            <span 
              v-for="tab in tabs" 
              :key="tab.value"
              :class="['tab-item', { active: currentTab === tab.value }]"
              @click="currentTab = tab.value"
            >
              {{ tab.label }}
            </span>
          </div>

          <!-- 分类筛选 -->
          <div class="category-filter" v-if="currentTab === 'competition' && !searchKeyword">
            <span 
              v-for="cat in ['全部', 'A', 'B', 'C']" 
              :key="cat"
              class="filter-item"
              :class="{ active: competitionFilter === cat }"
              @click="competitionFilter = cat"
            >
              {{ cat === '全部' ? '全部' : cat + '类' }}
            </span>
          </div>

          <!-- 学院筛选 -->
          <div class="college-filter" v-if="currentTab === 'research' && !searchKeyword">
            <select v-model="collegeFilter" class="college-select">
              <option value="">全部学院</option>
              <option v-for="college in colleges" :key="college" :value="college">
                {{ college }}
              </option>
            </select>
          </div>

          <!-- 标签列表 - 阻止滚动穿透 -->
          <div 
            class="tags-scroll-area" 
            @wheel.stop
            @touchmove.stop
          >
            <div v-if="filteredTags.length > 0" class="tags-grid">
              <div 
                v-for="tag in filteredTags" 
                :key="tag.name"
                class="tag-item-option"
                :class="{ 'is-selected': isTagSelected(tag) }"
                @click="toggleTag(tag)"
              >
                <span class="tag-source-badge">{{ tag.source === 'competition' ? '🏆' : '🔬' }}</span>
                <div class="tag-info">
                  <div class="tag-name">{{ tag.displayName || tag.name }}</div>
                  <div class="tag-extra">
                    {{ tag.source === 'competition' ? `${tag.category}类 · ${tag.type}` : tag.college }}
                  </div>
                </div>
                <span class="selected-mark" v-if="isTagSelected(tag)">✓</span>
              </div>
            </div>
            
            <div v-else class="no-results">
              <p>😕 未找到相关标签</p>
              <button class="create-tag-btn" @click="createCustomTag" v-if="searchKeyword">
                + 创建自定义标签 "{{ searchKeyword }}"
              </button>
            </div>
          </div>

          <!-- 底部 -->
          <div class="dropdown-footer">
            <span>已选择 {{ selectedTags.length }}/5 个标签</span>
            <button class="close-btn" @click="showDropdown = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})


const selectorRef = ref(null)
const showDropdown = ref(false)
const searchKeyword = ref('')
const currentTab = ref('competition')
const competitionFilter = ref('全部')
const collegeFilter = ref('')
const selectedTags = ref([...props.modelValue])
const dropdownStyle = ref({})
const emit = defineEmits(['update:modelValue', 'change'])  // 新增 change 事件
const tabs = [
  { label: '🏆 学术竞赛', value: 'competition' },
  { label: '🔬 科研立项', value: 'research' }
]

const colleges = [
  '地球科学学院', '资源学院', '环境学院', '工程学院',
  '地球物理学院', '材料与化学学院', '计算机学院', '经济管理学院'
]

// 竞赛标签数据
const competitionTags = ref([
  // A类
  { name: '全国地质技能大赛', category: 'A', type: '地质资源类' },
  { name: '资源勘查设计赛', category: 'A', type: '地质资源类' },
  { name: '地球物理竞赛', category: 'A', type: '地质资源类' },
  { name: '地质灾害防治赛', category: 'A', type: '地质资源类' },
  { name: '节能减排大赛', category: 'A', type: '环境工程类' },
  { name: '环境友好科技赛', category: 'A', type: '环境工程类' },
  { name: '水科学竞赛', category: 'A', type: '环境工程类' },
  { name: 'ACM程序设计', category: 'A', type: '信息技术类' },
  { name: '数学建模国赛', category: 'A', type: '信息技术类' },
  { name: '电子设计竞赛', category: 'A', type: '信息技术类' },
  { name: '智能汽车竞赛', category: 'A', type: '信息技术类' },
  // B类
  { name: '金相技能大赛', category: 'B', type: '材料科学类' },
  { name: '材料创新设计', category: 'B', type: '材料科学类' },
  { name: '结构设计大赛', category: 'B', type: '土木建筑类' },
  { name: 'BIM技术应用', category: 'B', type: '土木建筑类' },
  { name: '挑战杯创业赛', category: 'B', type: '经济管理类' },
  { name: '市场调查大赛', category: 'B', type: '经济管理类' },
  // C类
  { name: '英语演讲比赛', category: 'C', type: '外语文学类' },
  { name: '翻译大赛', category: 'C', type: '外语文学类' },
  { name: '广告艺术大赛', category: 'C', type: '艺术设计类' },
  { name: '定向越野赛', category: 'C', type: '体育竞技类' }
])

// 科研标签数据
const researchTags = ref([
  { name: '地质过程与矿产资源', college: '地球科学学院' },
  { name: '地球化学', college: '地球科学学院' },
  { name: '古生物学与地层学', college: '地球科学学院' },
  { name: '矿产普查与勘探', college: '资源学院' },
  { name: '能源地质工程', college: '资源学院' },
  { name: '水文地质与环境', college: '环境学院' },
  { name: '环境科学与工程', college: '环境学院' },
  { name: '岩土工程', college: '工程学院' },
  { name: '地质工程', college: '工程学院' },
  { name: '地球探测与信息技术', college: '地球物理学院' },
  { name: '材料科学与工程', college: '材料与化学学院' },
  { name: '计算机应用技术', college: '计算机学院' },
  { name: '软件工程', college: '计算机学院' },
  { name: '管理科学与工程', college: '经济管理学院' }
])

// 过滤标签
const filteredTags = computed(() => {
  let tags = currentTab.value === 'competition' 
    ? competitionTags.value.map(t => ({ ...t, source: 'competition', displayName: t.name }))
    : researchTags.value.map(t => ({ ...t, source: 'research', displayName: t.name }))
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    tags = tags.filter(t => 
      t.displayName.toLowerCase().includes(keyword) ||
      (t.type && t.type.toLowerCase().includes(keyword)) ||
      (t.college && t.college.toLowerCase().includes(keyword))
    )
  } else {
    if (currentTab.value === 'competition' && competitionFilter.value !== '全部') {
      tags = tags.filter(t => t.category === competitionFilter.value)
    }
    if (currentTab.value === 'research' && collegeFilter.value) {
      tags = tags.filter(t => t.college === collegeFilter.value)
    }
  }
  
  return tags
})

// 判断标签是否已选中
const isTagSelected = (tag) => {
  return selectedTags.value.some(t => t.name === tag.name)
}

// 切换标签选中
const toggleTag = (tag) => {
  const index = selectedTags.value.findIndex(t => t.name === tag.name)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    if (selectedTags.value.length >= 5) {
      alert('最多只能添加 5 个标签')
      return
    }
    selectedTags.value.push(tag)
  }
  emit('update:modelValue', selectedTags.value)
  emit('change', selectedTags.value)  // ✅ 新增：触发 change 事件
}

// 移除标签
const removeTag = (tag) => {
  selectedTags.value = selectedTags.value.filter(t => t.name !== tag.name)
  emit('update:modelValue', selectedTags.value)
  emit('change', selectedTags.value)  // ✅ 新增
}

// 创建自定义标签
const createCustomTag = () => {
  const tagName = searchKeyword.value.trim()
  if (!tagName) return
  
  const customTag = {
    name: tagName,
    displayName: tagName,
    source: 'custom',
    category: '自定义'
  }
  
  if (!isTagSelected(customTag)) {
    if (selectedTags.value.length >= 5) {
      alert('最多只能添加 5 个标签')
      return
    }
    selectedTags.value.push(customTag)
    emit('update:modelValue', selectedTags.value)
  }
  
  searchKeyword.value = ''
  showDropdown.value = false
}

// 计算下拉位置
const updateDropdownPosition = () => {
  if (!selectorRef.value) return
  
  const rect = selectorRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'absolute',
    top: rect.bottom + 8 + 'px',
    left: rect.left + 'px',
    width: rect.width + 'px',
    maxWidth: '500px'
  }
}

// 打开下拉
const openDropdown = () => {
  updateDropdownPosition()
  showDropdown.value = true
  // 禁止 body 滚动
  document.body.style.overflow = 'hidden'
}

// 关闭下拉时的处理
const closeDropdown = () => {
  showDropdown.value = false
  // 恢复 body 滚动
  document.body.style.overflow = ''
}

// 监听 showDropdown 变化
watch(showDropdown, (val) => {
  if (val) {
    nextTick(() => {
      updateDropdownPosition()
    })
  } else {
    document.body.style.overflow = ''
  }
})

// 监听窗口大小变化
const handleResize = () => {
  if (showDropdown.value) {
    updateDropdownPosition()
  }
}

// 同步外部变化
const syncWithModelValue = () => {
  selectedTags.value = [...props.modelValue]
}

watch(() => props.modelValue, syncWithModelValue, { deep: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize, true)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.tag-selector {
  position: relative;
  width: 100%;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #e8f0fe, #f0f4ff);
  border-radius: 20px;
  font-size: 13px;
  color: #004e9e;
  border: 1px solid #b8d4f5;
}

.tag-source {
  font-size: 14px;
}

.remove-tag {
  width: 18px;
  height: 18px;
  border: none;
  background: rgba(0, 78, 158, 0.1);
  border-radius: 50%;
  color: #004e9e;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}

.remove-tag:hover {
  background: #fee2e2;
  color: #ef4444;
}

.tag-input-wrapper {
  position: relative;
}

.tag-input {
  width: 100%;
  padding: 10px 32px 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.tag-input:focus {
  border-color: #004e9e;
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  background: #cbd5e1;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  cursor: pointer;
}
</style>

<style>
/* 全局样式 - 不加 scoped */
.tag-dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: transparent;
}

.tag-dropdown {
  position: absolute !important;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid #e8ecf0;
  display: flex;
  flex-direction: column;
  max-height: 450px;
  z-index: 10000;
}

.dropdown-tabs {
  display: flex;
  padding: 12px 16px;
  gap: 20px;
  border-bottom: 1px solid #edf1f7;
  flex-shrink: 0;
}

.tab-item {
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 20px;
  transition: all 0.2s;
}

.tab-item:hover {
  background: #f1f5f9;
}

.tab-item.active {
  background: #004e9e;
  color: white;
}

.category-filter {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #edf1f7;
  flex-shrink: 0;
}

.filter-item {
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 16px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
}

.filter-item:hover,
.filter-item.active {
  background: #004e9e;
  color: white;
}

.college-filter {
  padding: 12px 16px;
  border-bottom: 1px solid #edf1f7;
  flex-shrink: 0;
}

.college-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}

/* 可滚动区域 - 关键修复 */
.tags-scroll-area {
  flex: 1;
  overflow-y: auto !important;
  max-height: 280px;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}

.tags-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-item-option {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.tag-item-option:hover {
  background: #e8f0fe;
  border-color: #004e9e;
}

.tag-item-option.is-selected {
  background: #004e9e;
  border-color: #004e9e;
}

.tag-item-option.is-selected .tag-name,
.tag-item-option.is-selected .tag-extra {
  color: white;
}

.tag-source-badge {
  font-size: 20px;
  margin-right: 12px;
}

.tag-info {
  flex: 1;
}

.tag-name {
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 2px;
}

.tag-extra {
  font-size: 12px;
  color: #94a3b8;
}

.selected-mark {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.no-results {
  text-align: center;
  padding: 30px 20px;
}

.no-results p {
  color: #64748b;
  margin-bottom: 16px;
}

.create-tag-btn {
  padding: 8px 20px;
  background: #004e9e;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
}

.dropdown-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #edf1f7;
  font-size: 13px;
  color: #64748b;
  flex-shrink: 0;
  background: #fafbfc;
}

.close-btn {
  padding: 4px 16px;
  background: #e2e8f0;
  border: none;
  border-radius: 16px;
  color: #475569;
  cursor: pointer;
}

/* 滚动条 */
.tags-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.tags-scroll-area::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.tags-scroll-area::-webkit-scrollbar-track {
  background: #f1f5f9;
}
</style>