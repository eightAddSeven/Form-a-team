<template>
  <div class="main-layout">
    <!-- 左侧区域 4/5 -->
    <div class="left-content">
      <!-- 上方：发布框 -->
      <PostCreator @submit="handlePostSubmit" />
      
      <!-- 下方：帖子列表 -->
      <PostList 
        :posts="postList" 
        :has-more="hasMore"
        @loadMore="handleLoadMore"
        @postClick="handlePostClick"
        @like="handleLike"
        @comment="handleComment"
      />
    </div>
    
    <!-- 右侧区域 1/5 -->
    <div class="right-sidebar">
      <!-- 热搜榜 -->
      <HotSearch 
        :items="hotSearchList" 
        @itemClick="handleHotSearchClick"
        @viewMore="handleViewMoreHotSearch"
      />
      
      <!-- 热门话题 -->
      <TopicTags 
        :tags="hotTopics" 
        @tagClick="handleTopicClick"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PostCreator from '@/components/post/PostCreator.vue'
import PostList from '@/components/post/PostList.vue'
import HotSearch from '@/components/sidebar/HotSearch.vue'
import TopicTags from '@/components/sidebar/TopicTags.vue'

// 数据状态
const postList = ref([])
const hotSearchList = ref([])
const hotTopics = ref([])
const hasMore = ref(true)

// 方法
const handlePostSubmit = (postData) => {
  console.log('发布内容:', postData)
  // 添加到帖子列表
  postList.value.unshift({
    id: Date.now(),
    title: '新发布的帖子',
    content: postData.content,
    author: '当前用户',
    time: '刚刚',
    likes: 0,
    comments: 0,
    tags: postData.category ? [postData.category] : []
  })
}

const handleLoadMore = () => {
  console.log('加载更多帖子')
  // 模拟加载更多
  setTimeout(() => {
    const newPosts = [
      {
        id: Date.now() + 1,
        title: '加载的帖子 1',
        content: '这是新加载的帖子内容...',
        author: '用户A',
        time: '3小时前',
        likes: 15,
        comments: 3,
        tags: ['经验分享']
      },
      {
        id: Date.now() + 2,
        title: '加载的帖子 2',
        content: '这是另一个新加载的帖子...',
        author: '用户B',
        time: '5小时前',
        likes: 8,
        comments: 1,
        tags: ['求助']
      }
    ]
    postList.value.push(...newPosts)
    
    // 模拟没有更多数据
    if (postList.value.length > 10) {
      hasMore.value = false
    }
  }, 1000)
}

const handlePostClick = (post) => {
  console.log('点击帖子:', post)
}

const handleLike = (post) => {
  post.likes++
  console.log('点赞帖子:', post)
}

const handleComment = (post) => {
  console.log('评论帖子:', post)
}

const handleHotSearchClick = (item) => {
  console.log('点击热搜:', item)
}

const handleViewMoreHotSearch = () => {
  console.log('查看更多热搜')
}

const handleTopicClick = (tag) => {
  console.log('点击话题:', tag)
}

// 初始化数据
onMounted(() => {
  // 模拟热搜数据
  hotSearchList.value = [
    { id: 1, title: '全国大学生数学建模竞赛', heat: '125.6w', tag: '热' },
    { id: 2, title: '挑战杯创业计划大赛', heat: '98.3w', tag: '新' },
    { id: 3, title: '研究生科研立项申报', heat: '76.2w', tag: '热' },
    { id: 4, title: '互联网+创新创业大赛', heat: '68.9w', tag: '' },
    { id: 5, title: '全国地质技能竞赛', heat: '54.1w', tag: '荐' },
    { id: 6, title: '英语四六级备考', heat: '42.7w', tag: '' },
    { id: 7, title: '实验室纳新招募', heat: '38.5w', tag: '新' },
    { id: 8, title: 'ACM程序设计竞赛', heat: '31.2w', tag: '' },
    { id: 9, title: '论文写作技巧', heat: '28.6w', tag: '' },
    { id: 10, title: '考研复试经验', heat: '24.3w', tag: '热' }
  ]
  
  // 热门话题
  hotTopics.value = [
    '数学建模竞赛',
    '大创项目申报',
    '挑战杯经验',
    '实验室招募',
    '论文写作技巧',
    '四六级备考',
    '考研交流',
    '实习内推'
  ]
  
  // 模拟帖子数据
  postList.value = [
    {
      id: 1,
      title: '寻找数学建模队友',
      content: '大二学生，有一定编程基础，寻找两名队友参加全国大学生数学建模竞赛，希望有建模经验或编程能力强的同学加入！',
      author: '张三',
      avatar: '',
      time: '2小时前',
      likes: 24,
      comments: 8,
      tags: ['数学建模', '组队']
    },
    {
      id: 2,
      title: '大创项目经验分享',
      content: '刚完成国家级大创项目结题，分享一些申请和执行的注意事项：1. 选题要结合热点 2. 团队分工明确 3. 定期与导师沟通...',
      author: '李四',
      avatar: '',
      time: '昨天',
      likes: 56,
      comments: 12,
      tags: ['大创', '经验分享']
    },
    {
      id: 3,
      title: '地质技能大赛求指导',
      content: '下个月参加全国地质技能大赛，有没有参加过的大佬可以分享一下经验和注意事项？特别是野外实践部分。',
      author: '王五',
      avatar: '',
      time: '3天前',
      likes: 18,
      comments: 15,
      tags: ['地质技能', '求助']
    }
  ]
})
</script>

<style scoped>
.main-layout {
  display: flex;
  gap: 24px;
}

.left-content {
  flex: 4;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }
  
  .right-sidebar {
    order: -1;
  }
}
</style>