<template>
  <div class="nav-item dropdown" @mouseenter="showDropdown = true" @mouseleave="showDropdown = false">
    <span class="nav-link">
      科研立项
      <span class="arrow-down">▼</span>
    </span>
    
    <transition name="fade">
      <div class="dropdown-content research-dropdown" v-show="showDropdown">
        <div class="dropdown-container">
          <div class="college-grid">
            <div class="college-category" v-for="college in colleges" :key="college.name">
              <h4>{{ college.name }}</h4>
              <ul>
                <li v-for="project in college.projects" :key="project" @click="handleProjectClick(project)">
                  {{ project }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const showDropdown = ref(false)

const colleges = ref([
  {
    name: '地球科学学院',
    projects: ['地质过程与矿产资源', '地球化学', '古生物学与地层学', '构造地质学']
  },
  {
    name: '资源学院',
    projects: ['矿产普查与勘探', '能源地质工程', '数学地质与遥感']
  },
  {
    name: '环境学院',
    projects: ['水文地质与环境', '环境科学与工程', '大气科学']
  },
  {
    name: '工程学院',
    projects: ['岩土工程', '地质工程', '土木工程']
  },
  {
    name: '地球物理学院',
    projects: ['地球探测与信息技术', '固体地球物理']
  },
  {
    name: '材料与化学学院',
    projects: ['材料科学与工程', '应用化学']
  },
  {
    name: '计算机学院',
    projects: ['计算机应用技术', '软件工程', '信息安全']
  },
  {
    name: '经济管理学院',
    projects: ['管理科学与工程', '工商管理']
  }
])

const handleProjectClick = (project) => {
  router.push({ path: '/search', query: { tag: project } })
}
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
  left: -100px;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e8ecf0;
  z-index: 1000;
  width: 700px;
}

.dropdown-container {
  padding: 24px;
}

.college-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.college-category h4 {
  font-size: 14px;
  color: #004e9e;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}

.college-category ul {
  list-style: none;
}

.college-category li {
  font-size: 13px;
  color: #475569;
  padding: 6px 0;
  cursor: pointer;
  transition: color 0.2s;
}

.college-category li:hover {
  color: #004e9e;
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