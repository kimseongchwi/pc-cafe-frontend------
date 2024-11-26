<template>
    <div class="home-page">
      <header class="header">
        <h1>OO PC방에 오신 것을 환영합니다</h1>
      </header>
      
      <div class="container">
        <div class="auth-buttons">
          <router-link to="/login" class="auth-button">
            로그인
          </router-link>
          <router-link to="/register" class="auth-button">
            회원가입
          </router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'HomePage',
    mounted() {
      // 이미 로그인한 사용자가 홈페이지 접근 시 리다이렉트
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      
      if (token) {
        if (userRole === 'admin') {
          this.$router.push('/admin');
        } else if (userRole === 'user') {
          this.$router.push('/user');
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .home-page {
    min-height: 100vh;
    background-color: #f5f5f5;
    display: flex;
    flex-direction: column;
  }
  
  .header {
    background-color: #333;
    color: white;
    padding: 2rem;
    text-align: center;
  }
  
  .container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }
  
  .auth-buttons {
    display: flex;
    gap: 1rem;
  }
  
  .auth-button {
    padding: 1rem 2rem;
    border: none;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    font-size: 1.1rem;
    transition: all 0.2s ease;
  }
  
  .auth-button:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
  }
  </style>