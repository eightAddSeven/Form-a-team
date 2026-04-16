<template>
  <div class="city-selector" @click="toggleDropdown">
    <span class="city-name">{{ currentCity }}</span>
    <span class="arrow">▼</span>
    
    <div class="city-dropdown" v-show="showDropdown" @click.stop>
      <div class="dropdown-header">
        <h4>选择城市</h4>
        <button class="close-btn" @click="showDropdown = false">✕</button>
      </div>
      <div class="city-list">
        <div 
          class="city-item" 
          v-for="city in cities" 
          :key="city"
          :class="{ active: city === currentCity }"
          @click="selectCity(city)"
        >
          {{ city }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentCity = ref('武汉')
const showDropdown = ref(false)

const cities = ref([
  '北京', '上海', '广州', '深圳',
  '武汉', '杭州', '南京', '成都',
  '西安', '天津', '重庆', '苏州'
])

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const selectCity = (city) => {
  currentCity.value = city
  showDropdown.value = false
}
</script>

<style scoped>
.city-selector {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #f7f9fc;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.city-selector:hover {
  background-color: #eef2f6;
}

.city-name {
  font-weight: 500;
}

.arrow {
  font-size: 10px;
  color: #8c95a5;
}

.city-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e8ecf0;
  min-width: 200px;
  z-index: 1000;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #edf1f7;
}

.dropdown-header h4 {
  font-size: 16px;
  color: #1e293b;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 50%;
}

.close-btn:hover {
  background: #f1f5f9;
}

.city-list {
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.city-item {
  padding: 8px 12px;
  text-align: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.city-item:hover {
  background: #f1f5f9;
}

.city-item.active {
  background: #004e9e;
  color: white;
}
</style>