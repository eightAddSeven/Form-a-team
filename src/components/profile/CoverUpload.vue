<template>
  <div class="cover-upload">
    <div class="cover-preview" :style="{ backgroundImage: `url(${previewUrl || currentCover || defaultCover})` }">
      <div class="cover-actions">
        <button class="cover-btn" @click="triggerFileInput">
          <span>📷</span> 更换封面
        </button>
      </div>
      
      <div class="upload-progress-bar" v-if="isUploading">
        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
      </div>
    </div>
    
    <input 
      ref="fileInput"
      type="file" 
      accept="image/jpeg,image/png,image/webp"
      @change="handleFileSelect"
      style="display: none"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  currentCover: {
    type: String,
    default: ''
  },
  maxSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB
  }
})

const emit = defineEmits(['update', 'upload'])

const defaultCover = 'https://images.unsplash.com/photo-1499336315816-097655dcfbda?w=1200&h=300&fit=crop'

const fileInput = ref(null)
const previewUrl = ref('')
const isUploading = ref(false)
const uploadProgress = ref(0)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > props.maxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize / 1024 / 1024}MB`)
    return
  }
  
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  
  isUploading.value = true
  uploadProgress.value = 0
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const interval = setInterval(() => {
      uploadProgress.value += 20
      if (uploadProgress.value >= 100) {
        clearInterval(interval)
        
        previewUrl.value = e.target.result
        emit('update', e.target.result)
        emit('upload', { file, url: e.target.result })
        
        isUploading.value = false
        ElMessage.success('封面上传成功')
        
        setTimeout(() => {
          uploadProgress.value = 0
        }, 500)
      }
    }, 100)
  }
  reader.readAsDataURL(file)
  
  event.target.value = ''
}
</script>

<style scoped>
.cover-upload {
  width: 100%;
  height: 100%;
}

.cover-preview {
  position: relative;
  width: 100%;
  height: 200px;
  background-size: cover;
  background-position: center;
}

.cover-actions {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
}

.cover-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.2s;
}

.cover-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.upload-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.progress-fill {
  height: 100%;
  background: #004e9e;
  transition: width 0.3s;
}
</style>