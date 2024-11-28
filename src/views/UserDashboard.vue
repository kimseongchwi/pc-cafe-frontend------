<template>
  <div class="user-dashboard">
    <header class="header">
      <div class="header-content">
        <h1 class="header-title">메뉴 주문</h1>
        <div class="user-info">
          <span>{{ name }} 님</span>
          <button @click="logout" class="logout-button">로그아웃</button>
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
          주문하기
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
      menus: [],
      orders: [],
      refreshInterval: null
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
    logout() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userRole');
      this.$router.push('/');
    }
  },
  mounted() {
    this.fetchUserInfo();
    this.fetchMenus();
    this.fetchOrders();

    // 2초마다 메뉴 목록 자동 새로고침
    this.refreshInterval = setInterval(() => {
      if (this.currentTab === 'order') {
        this.fetchMenus();
      }
    }, 2000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
</script>

<style scoped>
.user-dashboard {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background-color: #333;
  color: white;
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  margin: 0;
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

.logout-button {
  padding: 0.5rem 1rem;
  border: 1px solid white;
  border-radius: 4px;
  background-color: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.logout-button:hover {
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