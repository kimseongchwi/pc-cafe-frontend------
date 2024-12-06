<template>
  <div class="admin-dashboard">
    <header class="header">
      <div class="header-content">
        <h1>PC방 관리자</h1>
        <div class="admin-tabs">
          <button 
            class="tab-button"
            :class="{ active: currentTab === 'menu' }"
            @click="setTab('menu')"
          >
            메뉴 관리
          </button>
          <button 
            class="tab-button"
            :class="{ active: currentTab === 'orders' }"
            @click="setTab('orders')"
          >
            주문 관리
            <span v-if="pendingOrders.length" class="order-badge">
              {{ pendingOrders.length }}
            </span>
          </button>
          <button 
            class="tab-button"
            :class="{ active: currentTab === 'seats' }"
            @click="setTab('seats')"
          >
            좌석 관리
          </button>
          <button 
            class="tab-button"
            :class="{ active: currentTab === 'users' }"
            @click="setTab('users')"
          >
            사용자 관리
          </button>
        </div>
        <div class="user-info">
          <span>관리자 {{ adminName }} 님</span>
          <button @click="logout" class="logout-button">로그아웃</button>
        </div>
      </div>
    </header>

    <!-- 알림 팝업 -->
    <div class="notifications">
      <div v-for="notification in notifications" 
           :key="notification.id" 
           class="notification"
           :style="{ top: notification.position + 'px' }">
        새로운 주문이 {{ notification.count }}건 들어왔습니다!
      </div>
    </div>

    <div class="container">
      <SeatManagement 
        v-if="currentTab === 'seats'"
        :seats="seats"
        @refresh-seats="fetchSeats"
      />
      <MenuManagement 
        v-else-if="currentTab === 'menu'"
        :menus="menus"
        @refresh-menus="fetchMenus"
      />
      <OrderManagement 
        v-else-if="currentTab === 'orders'"
        :orders="orders"
        @refresh-orders="fetchOrders"
      />
      <UserManagement 
        v-else
        :users="users"
        @refresh-users="fetchUsers"
        @reset-password="resetPassword"
      />
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import MenuManagement from '@/components/admin/MenuManagement.vue'
import OrderManagement from '@/components/admin/OrderManagement.vue'
import SeatManagement from '@/components/admin/SeatManagement.vue'
import UserManagement from '@/components/admin/UserManagement.vue'

export default {
  name: 'AdminDashboard',
  components: {
    MenuManagement,
    OrderManagement,
    SeatManagement,
    UserManagement
  },
  data() {
    return {
      currentTab: 'seats', // 기본 탭 설정
      adminName: '',
      menus: [],
      orders: [],
      seats: [],
      users: [],
      orderRefreshInterval: null,
      seatRefreshInterval: null,
      notifications: [],
      notificationId: 0,
      previousOrderCount: 0
    }
  },
  computed: {
    pendingOrders() {
      return this.orders.filter(order => order.status === 'pending');
    }
  },
  methods: {
    setTab(tab) {
      this.currentTab = tab;
      this.$router.push({ query: { tab } }); // URL 쿼리 파라미터 업데이트
    },
    async fetchAdminInfo() {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        this.adminName = response.data.name;
      } catch (error) {
        console.error('관리자 정보 로드 실패:', error);
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
        
        // 새 주문이 있는지 확인
        if (this.previousOrderCount !== 0 && response.data.length > this.previousOrderCount) {
          const newOrderCount = response.data.length - this.previousOrderCount;
          this.showNotification(newOrderCount);
        }
        this.previousOrderCount = response.data.length;
        this.orders = response.data;
      } catch (error) {
        console.error('주문 목록 로드 실패:', error);
        this.handleAuthError(error);
      }
    },
    async fetchSeats() {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('/api/admin/seats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        this.seats = response.data;
      } catch (error) {
        console.error('좌석 정보 로드 실패:', error);
        this.handleAuthError(error);
      }
    },
    async fetchUsers() {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        this.users = response.data.filter(user => user.role !== 'admin');
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
        this.handleAuthError(error);
      }
    },
    async resetPassword(userId) {
      const adminCode = prompt('정말 초기화 시키겠습니까? 관리자 번호를 입력하세요');
      if (adminCode === 'admin123') {
        try {
          const token = sessionStorage.getItem('token');
          await axios.post(`/api/users/${userId}/reset-password`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          alert('초기화되었습니다. 비밀번호는 1111입니다.');
        } catch (error) {
          console.error('비밀번호 초기화 실패:', error);
          this.handleAuthError(error);
        }
      } else {
        alert('잘못된 관리자 번호입니다.');
      }
    },
    showNotification(count) {
      const notification = {
        id: this.notificationId++,
        position: this.notifications.length * 60,
        count: count
      };
      this.notifications.push(notification);
      
      // 3초 후 알림 제거
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        // 남은 알림들의 위치 조정
        this.notifications.forEach((n, index) => {
          n.position = index * 60;
        });
      }, 3000);
    },
    startOrderRefresh() {
      // 3초마다 주문 목록 새로고침
      this.orderRefreshInterval = setInterval(() => {
        this.fetchOrders();
      }, 3000);
    },
    startSeatRefresh() {
      this.seatRefreshInterval = setInterval(() => {
        if (this.currentTab === 'seats') {
          this.fetchSeats();
        }
      }, 2000); // 2초마다 갱신
    },
    handleAuthError(error) {
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        this.logout();
      }
    },
    logout() {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userRole');
      this.$router.push('/');
    }
  },
  watch: {
    currentTab(newTab) {
      if (newTab === 'orders') {
        this.fetchOrders();
      } else if (newTab === 'seats') {
        this.fetchSeats();
      } else if (newTab === 'users') {
        this.fetchUsers();
      }
    }
  },
  mounted() {
    const tab = this.$route.query.tab;
    if (tab) {
      this.currentTab = tab; // URL 쿼리 파라미터에 따라 탭 설정
    }
    this.fetchAdminInfo();
    this.fetchMenus();
    this.fetchOrders();
    this.fetchSeats();
    this.fetchUsers();
    this.startOrderRefresh();
    this.startSeatRefresh();
  },
  beforeUnmount() {
    if (this.orderRefreshInterval) {
      clearInterval(this.orderRefreshInterval);
    }
    if (this.seatRefreshInterval) {
      clearInterval(this.seatRefreshInterval);
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background-color: #333;
  color: white;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-tabs {
  display: flex;
  gap: 1rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.tab-button.active {
  background-color: rgba(255, 255, 255, 0.2);
}

.order-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  min-width: 20px;
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-button {
  padding: 0.5rem 1rem;
  border: 1px solid white;
  border-radius: 4px;
  background-color: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
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

.notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.notification {
  background-color: #28a745;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  animation: slideIn 0.3s ease-out;
  position: absolute;
  right: 0;
  transition: top 0.3s ease-out;
  min-width: 250px;
  text-align: center;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .admin-tabs {
    width: 100%;
    justify-content: center;
  }

  .user-info {
    width: 100%;
    justify-content: center;
  }

  .container {
    margin: 1rem auto;
  }
}
</style>