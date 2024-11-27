import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import UserDashboard from '../views/UserDashboard.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  },
  {
    path: '/user',
    name: 'UserDashboard',
    component: UserDashboard,
    meta: { requiresAuth: true, requiresUser: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('token');
  const userRole = sessionStorage.getItem('userRole');

  // 인증이 필요한 페이지
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/');
      return;
    }

    // 관리자 전용 페이지
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      if (userRole !== 'admin') {
        next('/');
        return;
      }
    }

    // 일반 사용자 전용 페이지
    if (to.matched.some(record => record.meta.requiresUser)) {
      if (userRole !== 'user') {
        next('/');
        return;
      }
    }
  }

  next();
})

export default router