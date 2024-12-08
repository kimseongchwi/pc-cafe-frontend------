<template>
  <div class="home-page">
    <header class="header">
      <h1>OO PC방에 방문해주셔서 감사합니다</h1>
    </header>
    
    <div class="main-container">
      <!-- 좌석 섹션 -->
      <div class="seat-section" v-if="!isAdmin">
        <h2>좌석 현황</h2>
        <div class="seat-container">
          <div v-for="seat in seats" 
               :key="seat.number" 
               class="seat"
               :class="{ 
                 'occupied': seat.user_name
               }"
               @click="!seat.user_name && selectSeat(seat.number)">
            <span class="seat-number">{{ seat.number }}번</span>
            <span v-if="seat.user_name" class="remaining-time">{{ formatTime(seat.available_time) }}</span>
            <span class="status">{{ seat.user_name ? seat.user_name : '빈좌석' }}</span>
          </div>
        </div>
      </div>

      <!-- 로그인 섹션 -->
      <div class="auth-container">
        <h2>로그인</h2>
        <div class="notification-box">
          <div v-if="!selectedSeat && !noSeatError && !isAdmin" class="message-box">
            좌석을 선택해주세요<br>
            감사합니다
          </div>
          <div v-else-if="loginError" class="message-box error">
            <div v-for="message in errorMessage" :key="message">{{ message }}</div>
          </div>
          <div v-else-if="noSeatError" class="message-box error">
            좌석이 선택되지<br>
            않았습니다
          </div>
          <div v-else class="message-box">
            {{ selectedSeat }}번 좌석이<br>
            선택되었습니다
          </div>
        </div>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>아이디</label>
            <input 
              v-model="registerid" 
              type="text" 
              :class="{ 'input-error': registeridError }"
              @focus="clearError('registerid')"
              required>
          </div>
          <div class="form-group">
            <label>비밀번호</label>
            <input 
              v-model="password" 
              type="password" 
              :class="{ 'input-error': passwordError }"
              @focus="clearError('password')"
              required>
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

    <!-- 시간 충전 팝업 -->
    <div v-if="showTimeChargePopup" class="time-charge-popup">
      <h2>시간 충전</h2>
      <h3>남은 시간이 존재하지 않습니다</h3>
      <div v-for="(price, hours) in timeOptions" :key="hours" class="time-option">
        <button @click="chargeTime(hours)">{{ hours }}시간 - {{ price }}원</button>
      </div>
      <div>
        <label>결제 방식:</label>
        <select v-model="selectedPaymentMethod">
          <option value="cash">현금</option>
          <option value="card">카드</option>
        </select>
      </div>
      <button @click="showTimeChargePopup = false" class="close-popup">닫기</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'HomePage',
  data() {
    return {
      registerid: '',
      password: '',
      selectedSeat: null,
      loginError: false,
      registeridError: false,
      passwordError: false,
      noSeatError: false,
      isAdmin: false,
      seats: [], // 좌석 정보를 저장할 배열
      showTimeChargePopup: false,
      timeOptions: {
        1: 1000,
        2: 2000,
        3: 3000,
        5: 5000,
        10: 10000,
        50: 50000,
        100: 100000
      },
      selectedPaymentMethod: 'cash',
      errorMessage: [] // 오류 메시지 배열로 변경
    }
  },
  methods: {
    async fetchSeats() {
      try {
        const response = await axios.get('http://localhost:3000/api/seats');
        this.seats = response.data;
      } catch (error) {
        console.error('좌석 정보 불러오기 실패:', error);
      }
    },
    formatTime(seconds) {
      if (!seconds) return '0분';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
    },
    selectSeat(seatNumber) {
      const seat = this.seats.find(s => s.number === seatNumber);
      if (seat && seat.registerid) {
        alert('이미 사용 중인 좌석입니다.');
        return;
      }
      
      if (this.selectedSeat === seatNumber) {
        this.selectedSeat = null;
        return;
      }
      
      if (confirm(`${seatNumber}번 좌석을 선택하시겠습니까?`)) {
        this.selectedSeat = seatNumber;
        this.loginError = false;
        this.noSeatError = false;
        this.clearAllErrors();
      }
    },
    async handleLogin() {
        if (!this.registerid || !this.password) {
            this.registeridError = !this.registerid;
            this.passwordError = !this.password;
            return;
        }

        try {
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                registerid: this.registerid,
                password: this.password,
                seatNumber: this.selectedSeat
            });

            if (response.data.user && response.data.token) {
                this.loginError = false;
                this.noSeatError = false;

                // 세션 스토리지에 세션 ID 저장
                const sessionId = new Date().getTime(); // 간단한 세션 ID 생성
                sessionStorage.setItem('sessionId', sessionId);

                sessionStorage.setItem('token', response.data.token);
                sessionStorage.setItem('userRole', response.data.user.role);
                sessionStorage.setItem('userName', response.data.user.name);
                sessionStorage.setItem('seatNumber', this.selectedSeat);

                let url = '';
                if (response.data.user.role === 'admin') {
                    this.isAdmin = true;
                    url = '/admin';
                } else {
                    if (!this.selectedSeat) {
                        this.noSeatError = true;
                        setTimeout(() => {
                            this.noSeatError = false;
                        }, 2000);
                        return;
                    }
                    if (response.data.user.available_time <= 0) {
                        this.showTimeChargePopup = true;
                        return;
                    }
                    url = '/user';
                }

                // 새로운 창에서 페이지 열기
                window.open(url, '_blank');
            }
        } catch (error) {
            this.loginError = true;
            if (error.response && error.response.status === 403) {
                // 중복 로그인 경고 메시지
                this.errorMessage = ['중복 로그인되었습니다.', '먼저 사용을 종료해주세요.'];
            } else {
                console.error('Login error:', error);
                this.errorMessage = ['가입된 아이디 또는', '비밀번호가 틀립니다.'];
            }

            setTimeout(() => {
                this.loginError = false;
                this.registeridError = false;
                this.passwordError = false;
            }, 2000);
        }
    },
    async handleLogout() {
        try {
            await axios.post('http://localhost:3000/api/auth/logout', {}, {
                headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            });

            // 세션 스토리지에서 모든 정보 제거
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('userName');
            sessionStorage.removeItem('seatNumber');

            this.$router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
            alert('로그아웃에 실패했습니다.');
        }
    },
    async chargeTime(hours) {
      try {
        const response = await axios.post('http://localhost:3000/api/time-charge', {
          hours,
          paymentMethod: this.selectedPaymentMethod
        }, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        });

        alert(response.data.message);
        this.showTimeChargePopup = false;
        this.$router.push('/user');
      } catch (error) {
        console.error('시간 충전 오류:', error);
        alert('시간 충전에 실패했습니다.');
      }
    },
    clearError(field) {
      if (field === 'registerid') this.registeridError = false;
      if (field === 'password') this.passwordError = false;
    },
    clearAllErrors() {
      this.registeridError = false;
      this.passwordError = false;
      this.loginError = false;
      this.noSeatError = false;
    },
    preventF5(event) {
        if ((event.key === 'F5') || (event.ctrlKey && event.key === 'r')) {
            event.preventDefault();
        }
    }
  },
  mounted() {
    this.fetchSeats();
    const token = sessionStorage.getItem('token');
    const userRole = sessionStorage.getItem('userRole');
    const seatNumber = sessionStorage.getItem('seatNumber');
    
    if (token) {
      if (userRole === 'admin') {
        this.isAdmin = true;
        this.$router.push('/admin');
      } else if (seatNumber) {
        this.$router.push('/user');
      } else {
        // 좌석 번호가 없으면 로그아웃 처리
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('seatNumber');
      }
    }
    // 2초마다 좌석 정보 업데이트
    this.seatUpdateInterval = setInterval(this.fetchSeats, 2000);

    // F5 키 막기
    window.addEventListener('keydown', this.preventF5);
  },
  beforeUnmount() {
    // 컴포넌트가 언마운트될 때 인터벌 제거
    clearInterval(this.seatUpdateInterval);

    // F5 키 이벤트 제거
    window.removeEventListener('keydown', this.preventF5);
  }
}
</script>

<style scoped>
body {
    margin: 0;
    background-color: #f5f5f5;
}

.home-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    background-color: #333;
    color: white;
    padding: 1.5rem;
    text-align: center;
}

.header h1 {
    margin: 0;
    font-size: 1.8rem;
}

.main-container {
    display: flex;
    justify-content: center;
    gap: 2rem;
    padding: 2rem;
    max-width: 1600px;
    margin: 0 auto;
}
.remaining-time {
    position: absolute;
    top: 5px;       /* 위치 조정 */
    right: 5px;     /* 위치 조정 */
    font-size: 12px;
    color: #333;
    opacity: 0.8;
}

/* 좌석 섹션 */
.seat-section {
    flex: 3;
    background: white;
    padding: 3rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.seat-section h2 {
    margin-top: 0;
    margin-bottom: 2rem;
    text-align: center;
    font-size: 1.8rem;
}

.seat-container {
    display: grid;
    grid-template-columns: repeat(7, 1fr); /* 7개의 열로 설정 */
    gap: 16px;
    margin-top: 1.5rem;
}

.seat {
    position: relative;
    border: 1px solid #999;
    padding: 35px 25px;  /* padding 증가 */
    text-align: center;
    border-radius: 6px;
    height: 60px;        /* height 증가 */
    width: 140px;        /* width 추가 */
    cursor: pointer;
    background-color: #90EE90;
    transition: background-color 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.seat:hover {
    background-color: #7dcd7d;
}

.seat.occupied {
    background-color: #FF6B6B;
    color: white;
    cursor: not-allowed; /* 금지 표시 커서 */
}

.seat-number {
    position: absolute;
    top: 5px;       /* 위치 조정 */
    left: 5px;      /* 위치 조정 */
    font-size: 12px;
    color: #333;
    font-weight: bold;
    opacity: 0.8;
}

.status {
    font-size: 17px;
    font-weight: bold;
    white-space: nowrap;
}
.close-popup {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #f0f0f0;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.close-popup:hover {
  background-color: #ddd;
}

/* 로그인 섹션 */
.auth-container {
    flex: 0 0 300px;
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    height: fit-content;
    min-height: 400px;
    position: relative;
}

.auth-container h2 {
    margin-top: 0;
    margin-bottom: 2.5rem;
    text-align: center;
    font-size: 1.3rem;
    position: absolute;
    top: 1rem;
    left: 0;
    width: 100%;
}

.notification-box {
    height: 70px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 3.5rem;
}

.message-box {
    background-color: #e3f2fd;
    color: #1976d2;
    padding: 12px;
    border-radius: 4px;
    text-align: center;
    font-weight: bold;
    font-size: 1rem;
    width: 100%;
    line-height: 1.4;
}

.message-box.error {
    color: #d32f2f;
}

.form-group {
    margin-bottom: 0.8rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
    color: #333;
}

input {
    width: 100%;
    padding: 0.4rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
    box-sizing: border-box;
}

input:focus {
    outline: none;
    border-color: #007bff;
}

.input-error {
    border-color: #ff6b6b !important;
}

.button {
    padding: 0.4rem 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.3s ease;
}

.button-primary {
    background-color: #007bff;
    color: white;
    width: 100%;
}

.button-primary:hover {
    background-color: #0056b3;
}

.auth-links {
    margin-top: 0.8rem;
    text-align: center;
    font-size: 0.8rem;
}

.auth-links a {
    color: #007bff;
    text-decoration: none;
    margin: 0 5px;
}

.auth-links a:hover {
    text-decoration: underline;
}

/* 시간 충전 팝업 */
.time-charge-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 1000;
}

.time-option {
    margin-bottom: 1rem;
}

.time-option button {
    width: 100%;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    background-color: #007bff;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.time-option button:hover {
    background-color: #0056b3;
}
/* 반응형 디자인을 위한 미디어 쿼리 추가 */
@media (max-width: 1200px) {
    .seat-container {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (max-width: 992px) {
    .seat-container {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 768px) {
    .seat-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 576px) {
    .seat-container {
        grid-template-columns: repeat(1, 1fr);
    }
    
    .seat {
        width: 100%;
    }
}
</style>