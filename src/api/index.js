import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
})

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

API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me')
}

export const userAPI = {
  getUser: (id) => API.get(`/users/${id}`),
  updateProfile: (data) => API.put('/users/profile', data),
  followUser: (id) => API.post(`/users/${id}/follow`),
  getUserPosts: (id, params) => API.get(`/users/${id}/posts`, { params }),
  getUserCollections: (id, params) => API.get(`/users/${id}/collections`, { params }),
  getFollowing: (id) => API.get(`/users/${id}/following`),
  getFollowers: (id) => API.get(`/users/${id}/followers`)
}

export const postAPI = {
  getPosts: (params) => API.get('/posts', { params }),
  getPost: (id) => API.get(`/posts/${id}`),
  createPost: (data) => API.post('/posts', data),
  updatePost: (id, data) => API.put(`/posts/${id}`, data),
  deletePost: (id) => API.delete(`/posts/${id}`),
  likePost: (id) => API.post(`/posts/${id}/like`),
  collectPost: (id) => API.post(`/posts/${id}/collect`),
  addComment: (id, data) => API.post(`/posts/${id}/comments`, data),
  deleteComment: (postId, commentId) => API.delete(`/posts/${postId}/comments/${commentId}`),
  getHotRank: (params) => API.get('/posts/hot-rank/list', { params })
}

export const searchAPI = {
  search: (params) => API.get('/search', { params }),
  getHotTags: () => API.get('/search/hot-tags')
}

export const tagAPI = {
  getTags: (params) => API.get('/tags', { params }),
  getTag: (name) => API.get(`/tags/${name}`)
}

export default API