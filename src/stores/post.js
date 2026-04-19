import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postAPI, searchAPI } from '@/api'

export const usePostStore = defineStore('post', () => {
  // 状态
  const posts = ref([])
  const currentPost = ref(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const total = ref(0)
  
  // 获取帖子列表
  const fetchPosts = async (params = {}) => {
    const { page = 1, pageSize = 10, category = 'all', tab = 'latest' } = params
    
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }
    
    try {
      const response = await postAPI.getPosts({ page, pageSize, category, tab })
      
      if (page === 1) {
        posts.value = response.data.posts || []
      } else {
        posts.value.push(...(response.data.posts || []))
      }
      
      hasMore.value = response.data.hasMore || false
      total.value = response.data.total || 0
      currentPage.value = page
      
      return { success: true, data: response.data.posts }
    } catch (error) {
      console.error('获取帖子失败:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }
  
  // 创建帖子
  const createPost = async (postData) => {
    try {
      const response = await postAPI.createPost(postData)
      
      if (response.data) {
        posts.value.unshift(response.data)
      }
      
      return { success: true, data: response.data }
    } catch (error) {
      console.error('创建帖子失败:', error)
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }
  
  // 获取帖子详情
  const fetchPostById = async (id) => {
    try {
      const response = await postAPI.getPost(id)
      currentPost.value = response.data
      return { success: true, data: response.data }
    } catch (error) {
      console.error('获取帖子详情失败:', error)
      return { success: false, error: error.message }
    }
  }
  
  // 点赞帖子
  const likePost = async (postId) => {
    try {
      const response = await postAPI.likePost(postId)
      
      // 更新本地状态
      const post = posts.value.find(p => p.id === postId || p._id === postId)
      if (post) {
        post.isLiked = response.data.isLiked
        post.likes = response.data.likes
      }
      
      if (currentPost.value && (currentPost.value.id === postId || currentPost.value._id === postId)) {
        currentPost.value.isLiked = response.data.isLiked
        currentPost.value.likes = response.data.likes
      }
      
      return { success: true, ...response.data }
    } catch (error) {
      console.error('点赞失败:', error)
      return { success: false, error: error.message }
    }
  }
  
  // 删除帖子
  const deletePost = async (postId) => {
    try {
      await postAPI.deletePost(postId)
      
      // 从列表中移除
      posts.value = posts.value.filter(p => {
        const id = p.id || p._id
        return id !== postId
      })
      
      return { success: true }
    } catch (error) {
      console.error('删除失败:', error)
      return { success: false, error: error.message }
    }
  }
  
  // 搜索帖子
  const searchPosts = async (params = {}) => {
    loading.value = true
    
    try {
      const response = await searchAPI.search(params)
      
      return {
        success: true,
        data: response.data.posts || [],
        hasMore: response.data.hasMore || false,
        total: response.data.total || 0,
        relatedTags: response.data.relatedTags || []
      }
    } catch (error) {
      console.error('搜索失败:', error)
      return { success: false, error: error.message, data: [] }
    } finally {
      loading.value = false
    }
  }
  
  // 重置状态
  const reset = () => {
    posts.value = []
    currentPost.value = null
    loading.value = false
    loadingMore.value = false
    hasMore.value = true
    currentPage.value = 1
    total.value = 0
  }
  
  return {
    posts,
    currentPost,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    total,
    fetchPosts,
    createPost,
    fetchPostById,
    likePost,
    deletePost,
    searchPosts,
    reset
  }
})