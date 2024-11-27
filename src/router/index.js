import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
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
    path: '/login',
    name: 'Login',
    component: LoginPage
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
      next('/login');
      return;
    }

    // 관리자 전용 페이지
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      if (userRole !== 'admin') {
        next('/login');  // user 페이지 대신 로그인 페이지로 리다이렉트
        return;
      }
    }

    // 일반 사용자 전용 페이지
    if (to.matched.some(record => record.meta.requiresUser)) {
      if (userRole !== 'user') {
        next('/login');  // admin 페이지 대신 로그인 페이지로 리다이렉트
        return;
      }
    }
  }

  next();
})

export default router