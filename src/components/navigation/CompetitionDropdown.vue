<template>
  <div class="nav-item dropdown" @mouseenter="showDropdown = true" @mouseleave="showDropdown = false">
    <span class="nav-link">
      学术竞赛
      <span class="arrow-down">▼</span>
    </span>
    
    <transition name="fade">
      <div class="dropdown-content competition-dropdown" v-show="showDropdown">
        <div class="dropdown-container">
          <!-- A类竞赛 -->
          <CompetitionCategory 
            level="A" 
            levelName="国家级"
            :categories="categoryA"
          />
          
          <!-- B类竞赛 -->
          <CompetitionCategory 
            level="B" 
            levelName="省级重点"
            :categories="categoryB"
          />
          
          <!-- C类竞赛 -->
          <CompetitionCategory 
            level="C" 
            levelName="校级/行业"
            :categories="categoryC"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CompetitionCategory from './CompetitionCategory.vue'

const showDropdown = ref(false)

// 竞赛分类数据
const categoryA = ref([
  {
    name: '地质资源类',
    tags: ['全国地质技能大赛', '资源勘查设计赛', '地球物理竞赛', '地质灾害防治赛']
  },
  {
    name: '环境工程类',
    tags: ['节能减排大赛', '环境友好科技赛', '水科学竞赛', '生态修复创新赛']
  },
  {
    name: '信息技术类',
    tags: ['ACM程序设计', '数学建模国赛', '电子设计竞赛', '智能汽车竞赛']
  }
])

const categoryB = ref([
  {
    name: '材料科学类',
    tags: ['金相技能大赛', '材料创新设计', '高分子竞赛', '纳米材料挑战赛']
  },
  {
    name: '土木建筑类',
    tags: ['结构设计大赛', 'BIM技术应用', '岩土工程竞赛', '测绘技能大赛']
  },
  {
    name: '经济管理类',
    tags: ['挑战杯创业赛', '市场调查大赛', '电子商务竞赛', '企业模拟竞争']
  }
])

const categoryC = ref([
  {
    name: '外语文学类',
    tags: ['英语演讲比赛', '翻译大赛', '写作竞赛', '模拟联合国']
  },
  {
    name: '艺术设计类',
    tags: ['广告艺术大赛', '工业设计赛', '数字媒体竞赛', '建筑手绘大赛']
  },
  {
    name: '体育竞技类',
    tags: ['定向越野赛', '攀岩挑战赛', '户外技能赛', '武术锦标赛']
  }
])
</script>

<style scoped>
.nav-item {
  position: relative;
  cursor: pointer;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #3c4a5a;
  font-size: 16px;
  font-weight: 500;
}

.nav-item:hover .nav-link {
  color: #004e9e;
}

.arrow-down {
  font-size: 10px;
  color: #8c95a5;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: -200px;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e8ecf0;
  z-index: 1000;
  width: 800px;
}

.dropdown-container {
  padding: 24px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>