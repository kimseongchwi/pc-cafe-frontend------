import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// axios 기본 설정
axios.defaults.baseURL = 'http://localhost:3000';

// 요청 인터셉터
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      router.push('/');
    }
    return Promise.reject(error);
  }
);

const app = createApp(App)
app.use(router)
app.mount('#app')