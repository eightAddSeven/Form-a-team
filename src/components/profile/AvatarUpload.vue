<template>
  <div class="avatar-upload">
    <div class="upload-area" @click="triggerFileInput">
      <div class="avatar-preview" :class="{ uploading: isUploading }">
        <img :src="previewUrl || currentAvatar || defaultAvatar" alt="avatar" />
        <div class="upload-overlay" v-if="!isUploading">
          <span class="upload-icon">📷</span>
          <span class="upload-text">更换头像</span>
        </div>
        <div class="upload-progress" v-if="isUploading">
          <div class="progress-ring">
            <span class="progress-text">{{ uploadProgress }}%</span>
          </div>
        </div>
      </div>
    </div>
    
    <input 
      ref="fileInput"
      type="file" 
      accept="image/jpeg,image/png,image/gif,image/webp"
      @change="handleFileSelect"
      style="display: none"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  currentAvatar: {
    type: String,
    default: ''
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  }
})

const emit = defineEmits(['update', 'upload'])

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 40 40\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23e2e8f0\'/%3E%3Ccircle cx=\'20\' cy=\'15\' r=\'7\' fill=\'%2394a3b8\'/%3E%3Cpath d=\'M8 32 Q20 24, 32 32\' fill=\'%2394a3b8\'/%3E%3C/svg%3E'

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
  
  // 检查文件大小
  if (file.size > props.maxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize / 1024 / 1024}MB`)
    return
  }
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  
  // 压缩并上传
  compressAndUpload(file)
  
  // 清空input
  event.target.value = ''
}

const compressAndUpload = (file) => {
  isUploading.value = true
  uploadProgress.value = 0
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      // 创建canvas进行压缩
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 设置最大尺寸
      const maxSize = 400
      let width = img.width
      let height = img.height
      
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height
          height = maxSize
        }
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      // 模拟上传进度
      const interval = setInterval(() => {
        uploadProgress.value += 20
        if (uploadProgress.value >= 100) {
          clearInterval(interval)
          
          // 获取压缩后的图片
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.8)
          previewUrl.value = compressedUrl
          
          emit('update', compressedUrl)
          emit('upload', { file, url: compressedUrl })
          
          isUploading.value = false
          ElMessage.success('头像上传成功')
          
          setTimeout(() => {
            uploadProgress.value = 0
          }, 500)
        }
      }, 100)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}
</script>

<style scoped>
.avatar-upload {
  display: inline-block;
}

.upload-area {
  cursor: pointer;
}

.avatar-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
}

.avatar-preview:hover .upload-overlay {
  opacity: 1;
}

.upload-icon {
  font-size: 24px;
}

.upload-text {
  font-size: 11px;
}

.upload-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
}
</style>