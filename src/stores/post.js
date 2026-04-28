import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postAPI, searchAPI } from '@/api'
import { useUserStore } from '@/stores/user'

export const usePostStore = defineStore('post', () => {
  const posts = ref([])
  const currentPost = ref(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const total = ref(0)

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

      const responsePosts = response.data.posts || []  
      const processedPosts = responsePosts.map(post => ({
        ...post,
        id: post._id || post.id,
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

  const createPost = async (postData) => {
    try {
      console.log('创建帖子数据:', postData)
      const response = await postAPI.createPost(postData)
      console.log('创建帖子响应:', response.data)
      const newPost = {
        ...response.data,
        id: response.data._id || response.data.id,
        isLiked: false,
        isCollected: false
      }
      posts.value.unshift(newPost)
      return { success: true, data: newPost }
    } catch (error) {
      console.error('创建帖子失败:', error)
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }
  
 const fetchPostById = async (id) => {
  try {
    const response = await postAPI.getPost(id)
    const data = response.data

    // ✅ 确保 comments 是数组
    if (!Array.isArray(data.comments)) {
      data.comments = []
    }

    const post = {
      ...data,
      id: data._id || data.id,
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

  const collectPost = async (postId) => {
    try {
      const response = await postAPI.collectPost(postId)
      const post = posts.value.find(p => (p.id || p._id) === postId)
      if (post) {
        post.isCollected = response.data.isCollected
      }
      if (currentPost.value && (currentPost.value.id === postId || currentPost.value._id === postId)) {
        currentPost.value.isCollected = response.data.isCollected
      }
      return { success: true, ...response.data }
    } catch (error) {
      console.error('收藏失败:', error)
      return { success: false, error: error.message }
    }
  }

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

  const reset = () => {
    posts.value = []
    currentPost.value = null
    loading.value = false
    loadingMore.value = false
    hasMore.value = true
    currentPage.value = 1
    total.value = 0
  }

 // 发表评论
const addComment = async (postId, content) => {
  try {
    const response = await postAPI.addComment(postId, { content });
    const newComment = response.data;

    if (!newComment.author || !newComment.author.nickname) {
      const userStore = useUserStore()  // 需要导入
      newComment.author = {
        _id: userStore.userInfo?.id || userStore.userInfo?._id,
        nickname: userStore.userInfo?.nickname || userStore.userInfo?.username || '用户',
        avatar: userStore.userInfo?.avatar || ''
      }
    }

    // 1. 更新帖子列表中的评论数量（只更新数量，不是数组）
    const postInList = posts.value.find(p => (p.id || p._id) === postId);
    if (postInList) {
      // 如果 comments 是数字，直接加 1
      if (typeof postInList.comments === 'number') {
        postInList.comments += 1;
      } else if (Array.isArray(postInList.comments)) {
        // 如果是数组，也添加（保险处理）
        postInList.comments.unshift(newComment);
      }
    }

    // 2. 更新当前帖子详情
    if (currentPost.value && (currentPost.value.id === postId || currentPost.value._id === postId)) {
      // 确保 comments 是数组
      if (!Array.isArray(currentPost.value.comments)) {
        currentPost.value.comments = [];
      }
      currentPost.value.comments.unshift(newComment);
      
      // 强制触发响应式更新
      currentPost.value = { ...currentPost.value };
    }

    return { success: true, data: newComment };
  } catch (error) {
    console.error('发表评论失败:', error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// 删除评论
const deleteComment = async (postId, commentId) => {
  try {
    await postAPI.deleteComment(postId, commentId);

    // 更新帖子列表中的评论数量
    const postInList = posts.value.find(p => (p.id || p._id) === postId);
    if (postInList) {
      if (typeof postInList.comments === 'number' && postInList.comments > 0) {
        postInList.comments -= 1;
      } else if (Array.isArray(postInList.comments)) {
        postInList.comments = postInList.comments.filter(c => c._id !== commentId);
      }
    }

    // 更新当前帖子详情
    if (currentPost.value && (currentPost.value.id === postId || currentPost.value._id === postId)) {
      if (Array.isArray(currentPost.value.comments)) {
        currentPost.value.comments = currentPost.value.comments.filter(c => c._id !== commentId);
        currentPost.value = { ...currentPost.value };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('删除评论失败:', error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};
  
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
    collectPost,
    deletePost,
    searchPosts,
    reset,
    addComment,
    deleteComment,
  }
})