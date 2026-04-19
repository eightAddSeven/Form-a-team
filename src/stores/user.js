import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api'

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  
  // 设置用户信息
  const setUserInfo = (info) => {
    userInfo.value = info
    if (info) {
      localStorage.setItem('userInfo', JSON.stringify(info))
    } else {
      localStorage.removeItem('userInfo')
    }
  }
  
  // 设置 token
  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }
  
  // 登录
  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password })
      
      setToken(response.data.token)
      setUserInfo(response.data.user)
      
      return { success: true, data: response.data }
    } catch (error) {
      console.error('登录失败:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || '登录失败，请检查用户名和密码' 
      }
    }
  }
  
  // 注册
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('注册失败:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || '注册失败，请重试' 
      }
    }
  }
  
  // 登出
  const logout = () => {
    setToken('')
    setUserInfo(null)
    // 可以在这里添加路由跳转
    window.location.href = '/'
  }
  
  // 获取当前用户信息
  const fetchUserInfo = async () => {
    if (!token.value) return { success: false }
    
    try {
      const response = await authAPI.getMe()
      setUserInfo(response.data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // token 失效，清除登录状态
      if (error.response?.status === 401) {
        logout()
      }
      return { success: false, error: error.message }
    }
  }
  
  // 从本地存储恢复用户信息
  const restoreUserInfo = () => {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch (e) {
        console.error('解析用户信息失败', e)
      }
    }
  }
  
  // 更新用户信息（本地）
  const updateUserInfo = (updates) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...updates }
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }
  
  // 初始化：恢复用户信息
  restoreUserInfo()
  
  // 如果有 token 但没有用户信息，尝试获取
  if (token.value && !userInfo.value) {
    fetchUserInfo()
  }
  
  return {
    // 状态
    userInfo,
    token,
    isLoggedIn,
    
    // 方法
    setUserInfo,
    setToken,
    login,
    register,
    logout,
    fetchUserInfo,
    updateUserInfo
  }
})