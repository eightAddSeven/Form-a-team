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
    
    console.log('fetchPosts 调用:', { page, category, tab })
    
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }
    
    try {
      const response = await postAPI.getPosts({ page, pageSize, category, tab })
      
      console.log('获取帖子响应:', response.data)
      
      // 处理后端返回的数据
      const responsePosts = response.data.posts || []
      
      // 确保每个帖子都有正确的字段
      const processedPosts = responsePosts.map(post => ({
        ...post,
        id: post._id || post.id,  // 统一使用 id
        isLiked: post.isLiked || false,
        isCollected: post.isCollected || false,
        likes: post.likes || [],
        comments: post.comments || []
      }))
      
      if (page === 1) {
        posts.value = processedPosts
      } else {
        posts.value.push(...processedPosts)
      }
      
      hasMore.value = response.data.hasMore || false
      total.value = response.data.total || 0
      currentPage.value = page
      
      console.log('当前帖子数量:', posts.value.length)
      
      return { success: true, data: processedPosts }
    } catch (error) {
      console.error('获取帖子失败:', error)
      return { success: false, error: error.message, data: [] }
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }
  
  // 创建帖子
  const createPost = async (postData) => {
    try {
      console.log('创建帖子数据:', postData)
      
      const response = await postAPI.createPost(postData)
      
      console.log('创建帖子响应:', response.data)
      
      // 处理返回的帖子数据
      const newPost = {
        ...response.data,
        id: response.data._id || response.data.id,
        isLiked: false,
        isCollected: false
      }
      
      // 添加到列表最前面
      posts.value.unshift(newPost)
      
      return { success: true, data: newPost }
    } catch (error) {
      console.error('创建帖子失败:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      }
    }
  }
  
  // 获取帖子详情
  const fetchPostById = async (id) => {
    try {
      const response = await postAPI.getPost(id)
      
      const post = {
        ...response.data,
        id: response.data._id || response.data.id,
        isLiked: false,
        isCollected: false
      }
      
      currentPost.value = post
      return { success: true, data: post }
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
      const post = posts.value.find(p => (p.id || p._id) === postId)
      if (post) {
        post.isLiked = response.data.isLiked
        post.likes = Array.isArray(response.data.likes) 
          ? response.data.likes 
          : { length: response.data.likes }
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
      
      const responsePosts = response.data.posts || []
      const processedPosts = responsePosts.map(post => ({
        ...post,
        id: post._id || post.id,
        isLiked: false,
        isCollected: false
      }))
      
      return {
        success: true,
        data: processedPosts,
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