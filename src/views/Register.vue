<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h2>创建账号</h2>
        <p>加入CUG学术社区，开启学术之旅</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-row">
          <div class="form-group">
            <label>用户名</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input 
                v-model="form.username" 
                type="text" 
                placeholder="请输入用户名"
                required
              />
            </div>
          </div>
          
          <div class="form-group">
            <label>昵称</label>
            <div class="input-wrapper">
              <span class="input-icon">📝</span>
              <input 
                v-model="form.nickname" 
                type="text" 
                placeholder="请输入昵称"
                required
              />
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>学号</label>
          <div class="input-wrapper">
            <span class="input-icon">🎓</span>
            <input 
              v-model="form.studentId" 
              type="text" 
              placeholder="请输入学号"
              required
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>学院</label>
            <select v-model="form.college" class="form-select" required>
              <option value="">请选择学院</option>
              <option value="地球科学学院">地球科学学院</option>
              <option value="资源学院">资源学院</option>
              <option value="环境学院">环境学院</option>
              <option value="工程学院">工程学院</option>
              <option value="地球物理学院">地球物理学院</option>
              <option value="材料与化学学院">材料与化学学院</option>
              <option value="计算机学院">计算机学院</option>
              <option value="经济管理学院">经济管理学院</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>专业</label>
            <div class="input-wrapper">
              <span class="input-icon">📚</span>
              <input 
                v-model="form.major" 
                type="text" 
                placeholder="请输入专业"
                required
              />
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>邮箱</label>
          <div class="input-wrapper">
            <span class="input-icon">📧</span>
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="请输入邮箱"
              required
            />
          </div>
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码（至少6位）"
              required
            />
            <span class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </span>
          </div>
        </div>
        
        <div class="form-group">
          <label>确认密码</label>
          <div class="input-wrapper">
            <span class="input-icon">✓</span>
            <input 
              v-model="form.confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              required
            />
            <span class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </span>
          </div>
        </div>
        
        <div class="form-agreement">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.agree" />
            <span>我已阅读并同意 <a href="#">《用户协议》</a> 和 <a href="#">《隐私政策》</a></span>
          </label>
        </div>
        
        <button type="submit" class="register-btn" :disabled="loading || !form.agree">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="register-footer">
        <p>已有账号？ <router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  username: '',
  nickname: '',
  studentId: '',
  college: '',
  major: '',
  email: '',
  password: '',
  confirmPassword: '',
  agree: false
})

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  if (form.password.length < 6) {
    ElMessage.error('密码长度至少为6位')
    return
  }
  
  loading.value = true
  
  const result = await userStore.register(form)
  
  if (result.success) {
    ElMessage.success('注册成功！请登录')
    router.push('/login')
  } else {
    ElMessage.error(result.error || '注册失败，请重试')
  }
  
  loading.value = false
}
</script>

<style scoped>
.register-container {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h2 {
  font-size: 28px;
  color: #1e293b;
  margin-bottom: 8px;
}

.register-header p {
  color: #64748b;
  font-size: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #1e293b;
  font-weight: 500;
  font-size: 14px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  font-size: 18px;
  z-index: 1;
}

.input-wrapper input,
.form-select {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s;
  background: white;
}

.form-select {
  padding-left: 40px;
  cursor: pointer;
}

.input-wrapper input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.toggle-password {
  position: absolute;
  right: 12px;
  cursor: pointer;
  font-size: 18px;
}

.form-agreement {
  margin-bottom: 24px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
}

.checkbox-label a {
  color: #667eea;
  text-decoration: none;
}

.register-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.register-btn:hover {
  transform: translateY(-2px);
}

.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-footer {
  margin-top: 24px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.register-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .register-card {
    padding: 24px;
  }
}
</style>