<template>
  <div class="home-page">
    <header class="header">
      <h1>OO PC방에 방문해주셔서 감사합니다</h1>
    </header>
    
    <div class="container">
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
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'HomePage',
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
          
          sessionStorage.setItem('token', response.data.token);
          sessionStorage.setItem('userRole', role);
          sessionStorage.setItem('userName', response.data.user.name);
          
          if (role === 'admin') {
            this.$router.push('/admin');
          } else if (role === 'user') {
            this.$router.push('/user');
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userName');
        alert(error.response?.data?.message || '로그인에 실패했습니다.');
        this.$router.push('/'); // 메인 페이지로 리다이렉션
      }
    }
  },
  mounted() {
    const token = sessionStorage.getItem('token');
    const userRole = sessionStorage.getItem('userRole');
    
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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.auth-container {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.button-primary {
  background-color: #007bff;
  color: white;
  width: 100%;
}

.button-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.auth-links {
  margin-top: 1rem;
  text-align: center;
}

.auth-links a {
  color: #007bff;
  text-decoration: none;
}

.auth-links a:hover {
  text-decoration: underline;
}
</style>