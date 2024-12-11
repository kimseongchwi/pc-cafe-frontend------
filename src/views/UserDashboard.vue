<template>
  <div class="user-dashboard">
    <!-- 시간 알림 메시지 -->
    <div v-if="showTimeNotification" class="time-notification">
      남은 시간은 {{ timeNotificationMessage }}분 입니다
    </div>

    <header class="header">
      <img src="/로고.png" alt="PC방 로고" class="logo-image" />
      <div class="header-content">
        <h1 class="header-title">PC CAFE</h1>
        <div class="user-info">
          <span class="seat-number">{{ seatNumber }}번 좌석</span>
          <span>{{ name }} 님</span>
          <span class="time-remaining">{{ formattedTime }}</span>
          <button @click="showTimeChargePopup = true" class="charge-button">시간 충전</button>
          <button @click="confirmLogout" class="logout-button">사용종료</button>
          <button @click="showPasswordChangePopup = true" class="change-password-button">비밀번호 변경</button>
        </div>
      </div>
    </header>

    <div class="container">
      <div class="dashboard-tabs">
        <button 
          class="tab-button"
          :class="{ active: currentTab === 'order' }"
          @click="setTab('order')"
        >
          메뉴주문
        </button>
        <button 
          class="tab-button"
          :class="{ active: currentTab === 'history' }"
          @click="setTab('history'); fetchOrders()"
        >
          주문내역 <span v-if="orders.length > 0">({{ orders.length }})</span>
        </button>
      </div>

      <OrderMenu 
        v-if="currentTab === 'order'"
        :menus="menus"
        @order-placed="handleOrderPlaced"
        @refresh-menus="fetchMenus"
      />
      
      <OrderHistory
        v-else
        :orders="orders"
        @refresh-orders="fetchOrders"
      />
    </div>

    <!-- 시간 충전 팝업 -->
    <div v-if="showTimeChargePopup" class="time-charge-popup">
      <h2>시간 충전</h2>
      <div v-for="(price, hours) in timeOptions" :key="hours" class="time-option">
        <button @click="chargeTime(hours)">{{ hours }}시간 - {{ price }}원</button>
      </div>
      <div>
        <label>결제 방식  </label>
        <select v-model="selectedPaymentMethod">
          <option value="cash">현금</option>
          <option value="card">카드</option>
        </select>
      </div>
      <button @click="showTimeChargePopup = false" class="close-popup">닫기</button>
    </div>

    <!-- 비밀번호 변경 팝업 -->
    <div v-if="showPasswordChangePopup" class="password-change-popup">
      <h2>비밀번호 변경</h2>
      <div class="form-group">
        <label>현재 비밀번호</label>
        <input type="password" v-model="currentPassword" class="input" />
      </div>
      <div class="form-group">
        <label>새 비밀번호</label>
        <input type="password" v-model="newPassword" class="input" />
      </div>
      <div class="form-group">
        <label>새 비밀번호 재입력</label>
        <input type="password" v-model="confirmNewPassword" class="input" />
      </div>
      <div class="modal-buttons">
        <button @click="changePassword" class="button button-primary">변경</button>
        <button @click="showPasswordChangePopup = false" class="button">취소</button>
      </div>
    </div>

    <!-- 로그아웃 확인 팝업 -->
    <div v-if="showLogoutPopup" class="logout-popup">
      <h2>사용을 종료하시겠습니까?</h2>
      <div class="modal-buttons">
        <button @click="logout" class="button button-primary">예 ({{ logoutCountdown }})</button>
        <button @click="cancelLogout" class="button">취소</button>
      </div>
    </div>

    <!-- 로그아웃 메시지 -->
    <div v-if="showLogoutMessage" class="logout-message">
      사용 종료되었습니다. 방문해주셔서 감사합니다.
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import OrderMenu from '@/components/user/OrderMenu.vue'
import OrderHistory from '@/components/user/OrderHistory.vue'

export default {
  name: 'UserDashboard',
  components: {
    OrderMenu,
    OrderHistory
  },
  data() {
    return {
      currentTab: 'order',
      name: '',
      seatNumber: '',
      menus: [],
      orders: [],
      availableTime: 0,
      refreshInterval: null,
      timeInterval: null,
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
      showTimeNotification: false,
      timeNotificationMessage: '',
      notificationTimeout: null,
      showPasswordChangePopup: false,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      showLogoutPopup: false,
      logoutCountdown: 5,
      logoutTimeout: null,
      showLogoutMessage: false // 로그아웃 메시지 표시 여부
    }
  },
  computed: {
    formattedTime() {
      const hours = Math.floor(this.availableTime / 3600);
      const minutes = Math.floor((this.availableTime % 3600) / 60);
      const seconds = this.availableTime % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  },
  methods: {
    setTab(tab) {
      this.currentTab = tab;
      this.$router.push({ query: { tab } }); // URL 쿼리 파라미터 업데이트
    },
    handleF5(event) {
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        return false;
      }
    },
    preventBrowserBack() {
      history.pushState(null, '', location.href);
      window.onpopstate = () => {
        history.pushState(null, '', location.href);
      };
    },
    showNotification(minutes) {
      this.timeNotificationMessage = minutes;
      this.showTimeNotification = true;
      
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }
      
      this.notificationTimeout = setTimeout(() => {
        this.showTimeNotification = false;
      }, 10000);
    },
    async fetchUserInfo() {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        this.name = response.data.name;
        this.seatNumber = response.data.seatNumber;
        this.availableTime = response.data.available_time;
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        this.handleAuthError(error);
      }
    },
    async fetchMenus() {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('/api/menus', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        this.menus = response.data;
      } catch (error) {
        console.error('메뉴 목록 로드 실패:', error);
        this.handleAuthError(error);
      }
    },
    async fetchOrders() {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        this.orders = response.data;
      } catch (error) {
        console.error('주문 목록 로드 실패:', error);
        this.handleAuthError(error);
      }
    },
    handleOrderPlaced() {
      this.fetchOrders();
    },
    handleAuthError(error) {
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        this.logout();
      }
    },
    confirmLogout() {
      this.showLogoutPopup = true;
      this.logoutCountdown = 5;
      this.logoutTimeout = setInterval(() => {
        if (this.logoutCountdown > 0) {
          this.logoutCountdown--;
        } else {
          clearInterval(this.logoutTimeout);
          this.logout();
        }
      }, 1000);
    },
    cancelLogout() {
      this.showLogoutPopup = false;
      if (this.logoutTimeout) {
        clearInterval(this.logoutTimeout);
      }
    },
    async logout() {
      try {
        const token = sessionStorage.getItem('token');
        await axios.post('/api/auth/logout', {
          remainingTime: this.availableTime
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('로그아웃 실패:', error);
      } finally {
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
        }
        if (this.timeInterval) {
          clearInterval(this.timeInterval);
        }
        if (this.notificationTimeout) {
          clearTimeout(this.notificationTimeout);
        }
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('seatNumber');
        
        // 메시지를 표시하고 2초 후에 홈페이지로 이동
        this.showLogoutMessage = true;
        setTimeout(() => {
          this.$router.push('/');
        }, 2000);
      }
    },
    startTimer() {
      this.timeInterval = setInterval(() => {
        if (this.availableTime > 0) {
          this.availableTime--;
          
          const minutes = Math.floor(this.availableTime / 60);
          
          if (minutes === 30 || minutes === 10 || minutes === 5 || 
              minutes === 3 || minutes === 1) {
            this.showNotification(minutes);
          }
        } else {
          clearInterval(this.timeInterval);
          alert('사용 가능한 시간이 모두 소진되었습니다.');
          this.logout();
        }
      }, 1000);
    },
    async chargeTime(hours) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.post('/api/time-charge', {
          hours,
          paymentMethod: this.selectedPaymentMethod
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data && response.data.message) {
          alert(response.data.message);
        }

        this.availableTime += hours * 3600;
        this.showTimeChargePopup = false;
      } catch (error) {
        console.error('시간 충전 실패:', error);
        alert('시간 충전에 실패했습니다.');
      }
    },
    async changePassword() {
      if (this.newPassword !== this.confirmNewPassword) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
      }

      try {
        const token = sessionStorage.getItem('token');
        await axios.post('/api/users/change-password', {
          currentPassword: this.currentPassword,
          newPassword: this.newPassword
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        alert('비밀번호가 변경 완료되었습니다.');
        this.showPasswordChangePopup = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
      } catch (error) {
        console.error('비밀번호 변경 실패:', error);
        alert('비밀번호 변경에 실패했습니다.');
      }
    }
  },
  mounted() {
    const tab = this.$route.query.tab;
    if (tab) {
      this.currentTab = tab; // URL 쿼리 파라미터에 따라 탭 설정
    }
    this.fetchUserInfo();
    this.fetchMenus();
    this.fetchOrders();
    this.startTimer();
    window.addEventListener('keydown', this.handleF5);
    this.preventBrowserBack();

    // 1초마다 사용자 정보 업데이트
    this.userInfoUpdateInterval = setInterval(this.fetchUserInfo, 1000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    if (this.logoutTimeout) {
      clearInterval(this.logoutTimeout);
    }
    clearInterval(this.userInfoUpdateInterval); // 인터벌 제거
    window.removeEventListener('keydown', this.handleF5);
  }
}
</script>

<style scoped>
.time-notification {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff9800;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 1000;
  animation: fadeInOut 10s forwards;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  10% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  90% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
}

.header {
  display: flex;
  align-items: center;
  background-color: #333;
  color: white;
  padding: 1rem;
  height: 80px; /* 상단바 높이 고정 */
  overflow: hidden; /* 내용이 상단바를 넘지 않도록 */
}

.logo-image {
  max-width: 100px; /* 로고의 최대 너비 */
  height: auto;
  margin-right: -5px; /* 로고와 텍스트 사이의 간격 */
  max-height: 100%; /* 로고의 최대 높이를 상단바 높이에 맞춤 */
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-title {
  padding-left: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-right: 1rem;
}

.user-info span {
  font-size: 1rem;
  color: #f0f0f0;
}

.seat-number {
  font-size: 1rem;
  color: #f0f0f0;
  background-color: #444;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
}

.time-remaining {
  font-size: 1rem;
  color: #f0f0f0;
  background-color: #555;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
}

.charge-button, .logout-button, .change-password-button {
  padding: 0.5rem 1rem;
  border: 1px solid white;
  border-radius: 4px;
  background-color: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.charge-button:hover, .logout-button:hover, .change-password-button:hover {
  background-color: white;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.dashboard-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  font-size: 1rem;
  font-weight: 500;
}

.tab-button.active {
  background-color: #007bff;
  color: white;
}

.tab-button:hover:not(.active) {
  background-color: #f0f0f0;
}

.time-charge-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  width: 300px;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  text-align: center; /* 제목과 내용을 가운데 정렬 */
}

.time-charge-popup h2 {
  margin-bottom: 1.5rem; /* 제목과 시간 선택 버튼 사이의 여백 */
}

.logout-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  text-align: center; /* 제목과 내용을 가운데 정렬 */
}


.password-change-popup{
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

.close-popup {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #f0f0f0;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s ease;
  float: right; /* 닫기 버튼을 오른쪽으로 이동 */
}

.close-popup:hover {
  background-color: #ddd;
}

.form-group {
  margin-bottom: 1rem;
}

.input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #f0f0f0;
  color: #333;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.button-primary {
  background-color: #007bff;
  color: white;
}

.button:hover {
  background-color: #ddd;
}

.button-primary:hover {
  background-color: #0056b3;
}

.logout-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #333;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 1000;
  text-align: center;
}

@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }

  .header-content {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
    padding: 0 0.5rem;
  }

  .header-title {
    font-size: 1.25rem;
    padding-left: 0;
  }

  .user-info {
    padding-right: 0;
  }

  .dashboard-tabs {
    width: 100%;
    justify-content: center;
    padding: 0;
    gap: 0.5rem;
  }

  .tab-button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .container {
    margin: 1rem auto;
    padding: 0 0.5rem;
  }

  .logout-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
    padding: 0;
  }

  .header-title {
    padding: 0;
  }

  .user-info {
    width: 100%;
    justify-content: center;
    padding: 0;
  }

  .dashboard-tabs {
    flex-direction: column;
    gap: 0.5rem;
  }

  .tab-button {
    width: 100%;
  }
}
</style>