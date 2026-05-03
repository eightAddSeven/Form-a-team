<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>欢迎来到组队平台</h2>
        <p>连接你我，共创卓越学术项目</p>
      </div>

      <div class="login-tabs">
        <div 
          class="tab-item" 
          :class="{ active: loginMode === 'password' }" 
          @click="loginMode = 'password'"
        >
          密码登录
        </div>
        <div 
          class="tab-item" 
          :class="{ active: loginMode === 'email' }" 
          @click="loginMode = 'email'"
        >
          免密登录/注册
        </div>
      </div>
      
      <form v-if="loginMode === 'password'" @submit.prevent="handlePasswordLogin" class="login-form">
        <div class="form-group">
          <label>账号</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input v-model="pwdForm.username" type="text" placeholder="请输入用户名/邮箱/学号" required />
          </div>
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input v-model="pwdForm.password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" required />
            <span class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </span>
          </div>
        </div>
        
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <form v-if="loginMode === 'email'" @submit.prevent="handleEmailLogin" class="login-form">
        <div class="form-group">
          <label>邮箱</label>
          <div class="input-wrapper">
            <span class="input-icon">📧</span>
            <input v-model="emailForm.email" type="email" placeholder="请输入真实邮箱" required />
          </div>
        </div>

        <div class="form-group">
          <label>验证码</label>
          <div class="input-wrapper code-wrapper">
            <span class="input-icon">🛡️</span>
            <input v-model="emailForm.code" type="text" placeholder="6位验证码" required maxlength="6" />
            <button 
              type="button" 
              class="get-code-btn" 
              :disabled="countdown > 0 || !emailForm.email"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
            </button>
          </div>
          <p class="email-tip">未注册的邮箱验证后将自动创建账号</p>
        </div>
        
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '进入平台...' : '登录 / 注册' }}
        </button>
      </form>
      
      <div class="login-footer" v-if="loginMode === 'password'">
        <p>还没有账号？ <router-link to="/register">去旧版注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import API from '@/api' // 引入配置好的 axios 实例

const router = useRouter()
const userStore = useUserStore()

const loginMode = ref('password') // 'password' 或 'email'
const loading = ref(false)
const showPassword = ref(false)

// 倒计时逻辑
const countdown = ref(0)
let timer = null

const pwdForm = reactive({
  username: '',
  password: ''
})

const emailForm = reactive({
  email: '',
  code: ''
})

// 密码登录
const handlePasswordLogin = async () => {
  loading.value = true
  const result = await userStore.login(pwdForm.username, pwdForm.password)
  if (result.success) {
    ElMessage.success('登录成功！')
    router.push('/')
  } else {
    ElMessage.error(result.error || '账号或密码错误')
  }
  loading.value = false
}

// 发送验证码
const sendCode = async () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailForm.email)) {
    return ElMessage.warning('请输入正确的邮箱格式')
  }

  try {
    await API.post('/auth/send-code', { email: emailForm.email })
    ElMessage.success('验证码已发送，请前往邮箱查收')
    
    // 开启 60 秒倒计时
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '发送失败，请稍后再试')
  }
}

// 邮箱登录/注册
const handleEmailLogin = async () => {
  loading.value = true
  try {
    // 调用后端接口
    const res = await API.post('/auth/email-login', { 
      email: emailForm.email, 
      code: emailForm.code 
    })
    
    // 复用 Pinia 中的登录成功后的信息保存逻辑
    localStorage.setItem('token', res.data.token)
    userStore.token = res.data.token
    userStore.userInfo = res.data.user
    
    ElMessage.success(res.data.message || '登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '验证码错误或已过期')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-header h2 {
  font-size: 26px;
  color: #1e293b;
  margin-bottom: 8px;
}

.login-header p {
  color: #64748b;
  font-size: 14px;
}

/* Tab 切换样式 */
.login-tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 15px;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-item.active {
  background: white;
  color: #004e9e;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
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
}

.input-wrapper input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s;
}

.input-wrapper input:focus {
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

.code-wrapper input {
  padding-right: 110px; /* 给右侧按钮留位置 */
}

.get-code-btn {
  position: absolute;
  right: 6px;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #004e9e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.get-code-btn:hover:not(:disabled) {
  background: #e8f0fe;
  border-color: #004e9e;
}

.get-code-btn:disabled {
  color: #94a3b8;
  cursor: not-allowed;
  background: #f1f5f9;
}

.email-tip {
  font-size: 12px;
  color: #10b981;
  margin-top: 8px;
}

.login-btn {
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

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.login-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}
</style>