<template>
  <div class="modal-overlay" v-if="visible" @click="handleClose">
    <div class="publish-modal" @click.stop>
      <div class="modal-header">
        <h3>发布内容</h3>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>
      <div class="modal-body">
        <p>快速发布功能已集成到上方输入框</p>
        <p>您可以直接在主区域发布内容</p>
      </div>
      <div class="modal-footer">
        <button class="modal-btn" @click="handleClose">知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 如果使用全局状态管理
// const store = useStore()
// const visible = computed(() => store.state.showPublishModal)

// 简单实现 - 您可以根据需要调整
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.publish-modal {
  background: white;
  border-radius: 16px;
  width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #edf1f7;
}

.modal-header h3 {
  font-size: 18px;
  color: #1e293b;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.modal-body {
  padding: 24px;
  text-align: center;
  color: #475569;
  line-height: 1.8;
}

.modal-footer {
  padding: 16px 24px 24px;
  text-align: center;
}

.modal-btn {
  background: #004e9e;
  color: white;
  border: none;
  padding: 10px 32px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn:hover {
  background: #0066cc;
}
</style>