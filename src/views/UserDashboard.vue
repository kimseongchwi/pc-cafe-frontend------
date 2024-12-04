<template>
  <div class="user-dashboard">
    <header class="header">
      <div class="header-content">
        <h1 class="header-title">OO PC방</h1>
        <div class="user-info">
          <span class="seat-number">{{ seatNumber }}번 좌석</span>
          <span>{{ name }} 님</span>
          <span class="time-remaining">{{ formattedTime }}</span> <!-- 남은 시간 표시 -->
          <button @click="showTimeChargePopup = true" class="charge-button">시간 충전</button>
          <button @click="logout" class="logout-button">사용종료</button>
        </div>
      </div>
    </header>

    <div class="container">
      <div class="dashboard-tabs">
        <button 
          class="tab-button"
          :class="{ active: currentTab === 'order' }"
          @click="currentTab = 'order'"
        >
          메뉴주문
        </button>
        <button 
          class="tab-button"
          :class="{ active: currentTab === 'history' }"
          @click="fetchOrders; currentTab = 'history'"
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
      availableTime: 0, // 사용 가능한 시간 (초 단위)
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
      selectedPaymentMethod: 'cash'
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
        this.availableTime = response.data.available_time; // 초 단위로 저장된 시간 그대로 사용
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
    async logout() {
      try {
        const token = sessionStorage.getItem('token');
        await axios.post('/api/auth/logout', {
          remainingTime: this.availableTime // 남은 시간을 서버에 전송
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
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('seatNumber');
        this.$router.push('/');
      }
    },
    startTimer() {
      this.timeInterval = setInterval(() => {
        if (this.availableTime > 0) {
          this.availableTime--;
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

        alert(response.data.message);
        this.availableTime += hours * 3600; // 충전된 시간을 초 단위로 추가
        this.showTimeChargePopup = false;
      } catch (error) {
        console.error('시간 충전 오류:', error);
        alert('시간 충전에 실패했습니다.');
      }
    }
  },
  mounted() {
    this.fetchUserInfo();
    this.fetchMenus();
    this.startTimer();
  },
  beforeUnmount() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  color: white;
  padding: 1rem;
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

.charge-button, .logout-button {
  padding: 0.5rem 1rem;
  border: 1px solid white;
  border-radius: 4px;
  background-color: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.charge-button:hover, .logout-button:hover {
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
}

.close-popup:hover {
  background-color: #ddd;
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