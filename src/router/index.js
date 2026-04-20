import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    // 修改点1：添加动态参数 :id?（可选）
    path: '/profile/:id?',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/Messages.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: () => import('@/views/PostDetail.vue')
  },
  {
    path: '/competitions',
    name: 'Competitions',
    component: () => import('@/views/Competitions.vue')
  },
  {
    path: '/research',
    name: 'Research',
    component: () => import('@/views/Research.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/SearchResult.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 修改点2：修复路由守卫弃用警告
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    // 直接返回路径，不再调用 next
    return '/login'
  }
  // 允许访问，无需返回
})

export default router