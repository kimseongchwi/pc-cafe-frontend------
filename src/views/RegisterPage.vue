<template>
    <div class="auth-page">
      <div class="auth-container">
        <h2>회원가입</h2>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>아이디</label>
            <div class="username-input">
              <input 
                v-model="form.username" 
                type="text" 
                required
                placeholder="아이디를 입력하세요"
              >
              <button 
                type="button" 
                @click="checkUsername" 
                class="button check-button"
                :disabled="!form.username || isChecking"
              >
                {{ isChecking ? '확인중...' : '중복확인' }}
              </button>
            </div>
            <small v-if="isUsernameChecked" class="success-text" :class="{ 'warning-text': !isUsernameValid }">
              {{ usernameMessage }}
            </small>
          </div>
  
          <div class="form-group">
            <label>비밀번호</label>
            <input 
              v-model="form.password" 
              type="password" 
              required
              placeholder="비밀번호를 입력하세요"
            >
          </div>
  
          <div class="form-group">
            <label>이름</label>
            <input 
              v-model="form.name" 
              type="text" 
              required
              placeholder="이름을 입력하세요"
            >
          </div>
  
          <div class="form-group">
            <label>주소 (선택)</label>
            <input 
              v-model="form.address" 
              type="text"
              placeholder="주소를 입력하세요"
            >
          </div>
  
          <div class="form-group">
            <label>가입 유형</label>
            <select v-model="form.role">
              <option value="user">일반 사용자</option>
              <option value="admin">관리자</option>
            </select>
          </div>
  
          <div class="form-group" v-if="form.role === 'admin'">
            <label>관리자 코드</label>
            <input 
              v-model="form.adminCode" 
              type="password" 
              required
              placeholder="관리자 코드를 입력하세요"
            >
          </div>
  
          <button 
            type="submit" 
            class="button button-primary"
            :disabled="!canSubmit"
          >
            가입하기
          </button>
  
          <div class="auth-links">
            <router-link to="/">이미 계정이 있으신가요? 로그인</router-link>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  
  export default {
    name: 'RegisterPage',
    data() {
      return {
        form: {
          username: '',
          password: '',
          name: '',
          address: '',
          role: 'user',
          adminCode: ''
        },
        isUsernameChecked: false,
        isUsernameValid: false,
        isChecking: false,
        usernameMessage: ''
      }
    },
    computed: {
      canSubmit() {
        return this.isUsernameChecked && 
               this.isUsernameValid &&
               this.form.password && 
               this.form.name &&
               (this.form.role !== 'admin' || this.form.adminCode);
      }
    },
    methods: {
      async checkUsername() {
        if (!this.form.username) {
          alert('아이디를 입력해주세요.');
          return;
        }
  
        try {
          this.isChecking = true;
          
          const response = await axios.get(
            `http://localhost:3000/api/auth/check-username/${this.form.username}`
          );
          
          this.isUsernameChecked = true;
  
          if (response.data.exists) {
            this.isUsernameValid = false;
            this.usernameMessage = '이미 사용 중인 아이디입니다.';
            alert('이미 사용 중인 아이디입니다.');
          } else {
            this.isUsernameValid = true;
            this.usernameMessage = '사용 가능한 아이디입니다.';
            alert('사용 가능한 아이디입니다.');
          }
        } catch (error) {
          console.error('Error:', error.response || error);
          this.isUsernameChecked = true;
          this.isUsernameValid = false;
          this.usernameMessage = '아이디 중복 확인에 실패했습니다.';
          alert(error.response?.data?.message || '아이디 중복 확인에 실패했습니다.');
        } finally {
          this.isChecking = false;
        }
      },
      async handleRegister() {
        if (!this.canSubmit) {
          alert('모든 필수 항목을 입력해주세요.');
          return;
        }
  
        try {
          await axios.post('http://localhost:3000/api/auth/register', this.form);
          alert('회원가입이 완료되었습니다.');
          this.$router.push('/');
        } catch (error) {
          console.error('Register error:', error.response || error);
          alert(error.response?.data?.message || '회원가입에 실패했습니다.');
        }
      }
    },
    watch: {
      'form.username'() {
        this.isUsernameChecked = false;
        this.isUsernameValid = false;
        this.usernameMessage = '';
      }
    }
  }
  </script>
  
  <style scoped>
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    padding: 2rem;
  }
  
  .auth-container {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .username-input {
    display: flex;
    gap: 0.5rem;
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
  
  .check-button {
    background-color: #6c757d;
    color: white;
    min-width: 100px;
  }
  
  .check-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  input, select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .success-text {
    color: #28a745;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  .warning-text {
    color: #dc3545;
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