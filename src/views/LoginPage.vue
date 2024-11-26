<template>
    <div class="auth-page">
      <div class="auth-container">
        <h2>로그인</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>아이디</label>
            <input v-model="username" type="text" required>
          </div>
          <div class="form-group">
            <label>비밀번호</label>
            <input v-model="password" type="password" required>
          </div>
          <button type="submit" class="button button-primary">로그인</button>
        </form>
        <div class="auth-links">
          <router-link to="/find-id">아이디 찾기</router-link> |
          <router-link to="/find-password">비밀번호 찾기</router-link> |
          <router-link to="/register">회원가입</router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  
  export default {
    data() {
      return {
        username: '',
        password: ''
      }
    },
    methods: {
      async handleLogin() {
        try {
          const response = await axios.post('http://localhost:3000/api/auth/login', {
            username: this.username,
            password: this.password
          });
          
          if (response.data.user && response.data.token) {
            const { role } = response.data.user;
            
            // 토큰과 사용자 정보 저장
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userRole', role);
            localStorage.setItem('userName', response.data.user.name);
            
            // role에 따른 리다이렉션
            if (role === 'admin') {
              this.$router.push('/admin');
            } else if (role === 'user') {
              this.$router.push('/user');
            } else {
              throw new Error('Invalid user role');
            }
          } else {
            throw new Error('Invalid response data');
          }
        } catch (error) {
          console.error('Login error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userName');
          alert(error.response?.data?.message || '로그인에 실패했습니다.');
        }
      }
    }
  }
  </script>