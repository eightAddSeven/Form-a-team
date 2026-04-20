import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
})

// 请求拦截器 - 添加 token
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器 - 处理错误
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // token 失效，清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      // 跳转到登录页（如果在非登录页）
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// 认证 API
export const authAPI = {
  // 登录
  login: (data) => API.post('/auth/login', data),
  
  // 注册
  register: (data) => API.post('/auth/register', data),
  
  // 获取当前用户信息
  getMe: () => API.get('/auth/me')
}

// 用户 API
export const userAPI = {
  // 获取用户信息
  getUser: (id) => API.get(`/users/${id}`),
  
  // 更新用户资料
  updateProfile: (data) => API.put('/users/profile', data),
  
  // 关注/取消关注用户
  followUser: (id) => API.post(`/users/${id}/follow`),
  
  // 获取用户的帖子
  getUserPosts: (id, params) => API.get(`/users/${id}/posts`, { params }),
  
  // 获取用户的收藏
  getUserCollections: (id, params) => API.get(`/users/${id}/collections`, { params })
}

// 帖子 API
export const postAPI = {
  // 获取帖子列表
  getPosts: (params) => API.get('/posts', { params }),
  
  // 获取单个帖子
  getPost: (id) => API.get(`/posts/${id}`),
  
  // 创建帖子
  createPost: (data) => API.post('/posts', data),
  
  // 更新帖子
  updatePost: (id, data) => API.put(`/posts/${id}`, data),
  
  // 删除帖子
  deletePost: (id) => API.delete(`/posts/${id}`),
  
  // 点赞/取消点赞
  likePost: (id) => API.post(`/posts/${id}/like`),
  
   // 发表评论（修改前：request.post → 修改后：API.post）
  addComment: (postId, data) => API.post(`/posts/${postId}/comments`, data),

  // 删除评论（修改前：request.delete → 修改后：API.delete）
  deleteComment: (postId, commentId) => API.delete(`/posts/${postId}/comments/${commentId}`),
}

// 搜索 API
export const searchAPI = {
  // 搜索
  search: (params) => API.get('/search', { params }),
  
  // 获取热门标签
  getHotTags: () => API.get('/search/hot-tags')
}

// 标签 API
export const tagAPI = {
  // 获取所有标签
  getTags: (params) => API.get('/tags', { params }),
  
  // 获取标签详情
  getTag: (name) => API.get(`/tags/${name}`)
}

export default API