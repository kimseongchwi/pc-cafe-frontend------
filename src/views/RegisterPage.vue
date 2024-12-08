<template>
  <div class="auth-page">
    <div class="auth-container">
      <h2>회원가입</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>아이디</label>
          <div class="registerid-input">
            <input 
              v-model="form.registerid" 
              type="text" 
              required
              placeholder="아이디를 입력하세요"
            >
            <button 
              type="button" 
              @click="checkRegisterid" 
              class="button check-button"
              :disabled="!form.registerid || isChecking"
            >
              {{ isChecking ? '확인중...' : '중복확인' }}
            </button>
          </div>
          <small v-if="isRegisteridChecked" class="success-text" :class="{ 'warning-text': !isRegisteridValid }">
            {{ registeridMessage }}
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
          <label>전화번호</label>
          <div class="phone-number-input">
            <input 
              v-model="form.phoneNumberPart1" 
              type="text" 
              required
              maxlength="3"
              readonly
            >
            <span>-</span>
            <input 
              v-model="form.phoneNumberPart2" 
              type="text" 
              required
              maxlength="4"
              @input="validatePhoneNumber"
            >
            <span>-</span>
            <input 
              v-model="form.phoneNumberPart3" 
              type="text" 
              required
              maxlength="4"
              @input="validatePhoneNumber"
            >
          </div>
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
import axios from 'axios';

export default {
  name: 'RegisterPage',
  data() {
    return {
      form: {
        registerid: '',
        password: '',
        name: '',
        phoneNumberPart1: '010',
        phoneNumberPart2: '',
        phoneNumberPart3: '',
        role: 'user',
        adminCode: ''
      },
      isRegisteridChecked: false,
      isRegisteridValid: false,
      isChecking: false,
      registeridMessage: ''
    }
  },
  computed: {
    canSubmit() {
      return this.isRegisteridChecked && 
             this.isRegisteridValid &&
             this.form.password && 
             this.form.name &&
             this.form.phoneNumberPart1.length == 3 &&
             this.form.phoneNumberPart2.length == 4 &&
             this.form.phoneNumberPart3.length == 4 &&
             (this.form.role !== 'admin' || this.form.adminCode);
    }
  },
  methods: {
    async checkRegisterid() {
      if (!this.form.registerid) {
        alert('아이디를 입력해주세요.');
        return;
      }

      try {
        this.isChecking = true;
        
        const response = await axios.get(
          `http://localhost:3000/api/auth/check-registerid/${this.form.registerid}`
        );
        
        this.isRegisteridChecked = true;

        if (response.data.exists) {
          this.isRegisteridValid = false;
          this.registeridMessage = '이미 사용 중인 아이디입니다.';
          alert('이미 사용 중인 아이디입니다.');
        } else {
          this.isRegisteridValid = true;
          this.registeridMessage = '사용 가능한 아이디입니다.';
          alert('사용 가능한 아이디입니다.');
        }
      } catch (error) {
        console.error('Error:', error.response || error);
        this.isRegisteridChecked = true;
        this.isRegisteridValid = false;
        this.registeridMessage = '아이디 중복 확인에 실패했습니다.';
        alert(error.response?.data?.message || '아이디 중복 확인에 실패했습니다.');
      } finally {
        this.isChecking = false;
      }
    },
    validatePhoneNumber() {
      this.form.phoneNumberPart2 = this.form.phoneNumberPart2.slice(0, 4);
      this.form.phoneNumberPart3 = this.form.phoneNumberPart3.slice(0, 4);
    },
    async handleRegister() {
      if (!this.canSubmit) {
        alert('모든 필수 항목을 입력해주세요.');
        return;
      }

      const phone_number = `${this.form.phoneNumberPart1}-${this.form.phoneNumberPart2}-${this.form.phoneNumberPart3}`;

      try {
        await axios.post('http://localhost:3000/api/auth/register', {
          ...this.form,
          phone_number
        });
        alert('회원가입이 완료되었습니다.');
        this.$router.push('/');
      } catch (error) {
        console.error('Register error:', error.response || error);
        alert(error.response?.data?.message || '회원가입에 실패했습니다.');
      }
    }
  },
  watch: {
    'form.registerid'() {
      this.isRegisteridChecked = false;
      this.isRegisteridValid = false;
      this.registeridMessage = '';
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

.registerid-input {
  display: flex;
  gap: 0.5rem;
}

.phone-number-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.phone-number-input input {
  width: 98px;
  text-align: center;
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