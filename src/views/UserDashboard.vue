<template>
    <div class="user-dashboard">
      <header class="header">
        <h1>메뉴 주문</h1>
        <div class="user-info">
          <span>{{ name }} 님</span>
          <button @click="logout" class="logout-button">로그아웃</button>
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
            @click="currentTab = 'history'"
          >
            주문내역
          </button>
        </div>
  
        <!-- 주문하기 -->
        <div v-if="currentTab === 'order'" class="order-section">
          <!-- 메뉴 리스트 영역 -->
          <div class="menu-section">
            <div class="category-tabs">
              <button 
                class="tab-button"
                :class="{ active: selectedCategory === 'all' }"
                @click="selectedCategory = 'all'"
              >
                전체
              </button>
              <button 
                v-for="category in categories" 
                :key="category"
                class="tab-button"
                :class="{ active: selectedCategory === category }"
                @click="selectedCategory = category"
              >
                {{ category }}
              </button>
            </div>
  
            <div class="menu-grid">
              <div v-for="menu in filteredMenus" :key="menu.id" class="menu-card">
                <img 
                  :src="menu.imageUrl || '/placeholder-menu.png'" 
                  :alt="menu.name"
                  class="menu-image"
                >
                <div class="menu-info">
                  <h3>{{ menu.name }}</h3>
                  <p class="menu-price">{{ menu.price.toLocaleString() }}원</p>
                  <p class="menu-category">{{ menu.category }}</p>
                  <div class="quantity-control">
                    <button 
                      @click="decreaseQuantity(menu.id)" 
                      class="quantity-button"
                      :disabled="!quantities[menu.id]"
                    >
                      -
                    </button>
                    <span class="quantity">{{ quantities[menu.id] || 0 }}</span>
                    <button 
                      @click="increaseQuantity(menu.id)" 
                      class="quantity-button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          <!-- 장바구니 영역 -->
          <div class="cart-section">
            <div class="cart-container">
              <h2>장바구니</h2>
              
              <div v-if="cartItems.length === 0" class="empty-cart">
                <p>장바구니가 비어있습니다</p>
              </div>
  
              <div v-else>
                <div class="cart-items">
                  <div v-for="menu in cartItems" :key="menu.id" class="cart-item">
                    <div class="cart-item-info">
                      <h4>{{ menu.name }}</h4>
                      <div class="cart-item-controls">
                        <div class="cart-quantity-control">
                          <button @click="decreaseQuantity(menu.id)" class="quantity-button">-</button>
                          <span class="quantity">{{ quantities[menu.id] }}</span>
                          <button @click="increaseQuantity(menu.id)" class="quantity-button">+</button>
                        </div>
                        <span class="cart-item-price">
                          {{ (menu.price * quantities[menu.id]).toLocaleString() }}원
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
  
                <div class="cart-summary">
                  <div class="cart-total">
                    <span>총 주문 금액</span>
                    <strong>{{ cartTotal.toLocaleString() }}원</strong>
                  </div>
                  <div class="cart-count">
                    <span>총 주문 수량</span>
                    <strong>{{ cartCount }}개</strong>
                  </div>
  
                  <div class="payment-method">
                    <label>결제 방식</label>
                    <select v-model="paymentMethod" class="payment-select">
                      <option value="card">카드 결제</option>
                      <option value="cash">현금 결제</option>
                    </select>
                  </div>
  
                  <button 
                    @click="placeOrder" 
                    class="button button-primary order-button"
                    :disabled="cartCount === 0"
                  >
                    주문하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 주문 내역 -->
        <div v-if="currentTab === 'history'" class="history-section">
          <h2>주문 내역</h2>
          <div class="order-list">
            <div v-for="order in orders" :key="order.id" class="order-item">
              <div class="order-header">
                <span class="order-date">{{ formatDate(order.created_at) }}</span>
                <span class="order-status" :class="order.status">
                  {{ getStatusText(order.status) }}
                </span>
              </div>
              <div class="order-content">
                <div class="order-menu">
                  <span>{{ order.menuName }}</span>
                  <span class="order-quantity">{{ order.quantity }}개</span>
                </div>
                <div class="order-price">
                  {{ (order.price * order.quantity).toLocaleString() }}원
                </div>
              </div>
              <div class="order-payment">
                결제 방식: {{ order.payment_method === 'card' ? '카드' : '현금' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  
  export default {
    name: 'UserDashboard',
    data() {
      return {
        currentTab: 'order',
        name: '',
        menus: [],
        orders: [],
        selectedCategory: 'all',
        categories: ['식사', '라면', '음료', '과자'],
        quantities: {},
        paymentMethod: 'card'
      }
    },
    computed: {
      filteredMenus() {
        if (this.selectedCategory === 'all') {
          return this.menus;
        }
        return this.menus.filter(menu => menu.category === this.selectedCategory);
      },
      cartItems() {
        return this.menus.filter(menu => this.quantities[menu.id] > 0);
      },
      cartTotal() {
        return this.cartItems.reduce((total, menu) => {
          return total + (menu.price * this.quantities[menu.id]);
        }, 0);
      },
      cartCount() {
        return Object.values(this.quantities).reduce((total, qty) => total + qty, 0);
      }
    },
    methods: {
      formatDate(dateString) {
        return new Date(dateString).toLocaleString();
      },
      getStatusText(status) {
        const statusMap = {
          'pending': '주문 접수',
          'processing': '처리 중',
          'completed': '완료',
          'cancelled': '취소'
        };
        return statusMap[status] || status;
      },
      increaseQuantity(menuId) {
        this.quantities[menuId] = (this.quantities[menuId] || 0) + 1;
      },
      decreaseQuantity(menuId) {
        if (this.quantities[menuId] > 0) {
          this.quantities[menuId]--;
          if (this.quantities[menuId] === 0) {
            delete this.quantities[menuId];
          }
        }
      },
      async fetchUserInfo() {
        try {
          const token = sessionStorage.getItem('token');
          const response = await axios.get('http://localhost:3000/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          this.name = response.data.name;
        } catch (error) {
          console.error('사용자 정보 로드 실패:', error);
          alert('사용자 정보를 불러오는데 실패했습니다.');
        }
      },
      async fetchMenus() {
        try {
          const token = sessionStorage.getItem('token');
          const response = await axios.get('http://localhost:3000/api/menus', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          this.menus = response.data;
        } catch (error) {
          console.error('메뉴 로드 실패:', error);
        }
      },
      async fetchOrders() {
        try {
          const token = sessionStorage.getItem('token');
          const response = await axios.get('http://localhost:3000/api/orders', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          this.orders = response.data;
        } catch (error) {
          console.error('주문 내역 로드 실패:', error);
        }
      },
      async placeOrder() {
        if (this.cartCount === 0) {
          return;
        }
  
        try {
          const token = sessionStorage.getItem('token');
          for (const menu of this.cartItems) {
            await axios.post('/api/orders', 
              {
                menuId: menu.id,
                quantity: this.quantities[menu.id],
                paymentMethod: this.paymentMethod
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
          }
          
          this.quantities = {};
          this.fetchOrders();
          alert('주문이 완료되었습니다.');
        } catch (error) {
          console.error('주문 실패:', error);
          alert('주문에 실패했습니다.');
        }
      },
      logout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('userName');
  this.$router.push('/login');
}
    },
    mounted() {
      this.fetchUserInfo();
      this.fetchMenus();
      this.fetchOrders();
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
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-tabs {
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
}

.order-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.menu-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: #f8f9fa;
  color: #495057;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-button.active {
  background-color: #007bff;
  color: white;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.menu-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid #eee;
}

.menu-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.menu-info {
  padding: 1rem;
}

.menu-price {
  color: #007bff;
  font-weight: bold;
  margin: 0.5rem 0;
}

.menu-category {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #e9ecef;
  border-radius: 20px;
  font-size: 0.9rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.quantity-button {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 4px;
  background-color: #e9ecef;
  cursor: pointer;
}

.quantity-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity {
  min-width: 30px;
  text-align: center;
}

.cart-section {
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.cart-container {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.cart-items {
  max-height: 400px;
  overflow-y: auto;
  margin: 1rem 0;
}

.cart-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.cart-item-info h4 {
  margin: 0 0 0.5rem 0;
}

.cart-item-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cart-item-price {
  font-weight: bold;
}

.cart-summary {
  border-top: 1px solid #eee;
  padding-top: 1rem;
  margin-top: 1rem;
}

.cart-total,
.cart-count {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.payment-method {
  margin: 1.5rem 0;
}

.payment-method label {
  display: block;
  margin-bottom: 0.5rem;
}

.payment-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.order-button {
 width: 100%;
 padding: 1rem;
 background-color: #007bff;
 color: white;
 border: none;
 border-radius: 4px;
 cursor: pointer;
 transition: all 0.2s ease;
}

.order-button:disabled {
 background-color: #ccc;
 cursor: not-allowed;
}

.empty-cart {
 text-align: center;
 padding: 2rem;
 color: #666;
}

.history-section {
 background: white;
 padding: 2rem;
 border-radius: 8px;
 box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.order-item {
 background: #f8f9fa;
 border-radius: 8px;
 padding: 1rem;
 margin-bottom: 1rem;
}

.order-header {
 display: flex;
 justify-content: space-between;
 margin-bottom: 1rem;
}

.order-date {
 color: #666;
}

.order-status {
 display: inline-block;
 padding: 0.25rem 0.75rem;
 border-radius: 20px;
 font-size: 0.9rem;
}

.order-status.pending {
 background-color: #ffd700;
}

.order-status.processing {
 background-color: #007bff;
 color: white;
}

.order-status.completed {
 background-color: #28a745;
 color: white;
}

.order-status.cancelled {
 background-color: #dc3545;
 color: white;
}

.order-content {
 display: flex;
 justify-content: space-between;
 align-items: center;
 margin-bottom: 0.5rem;
}

.order-menu {
 display: flex;
 gap: 1rem;
 align-items: center;
}

.order-quantity {
 color: #666;
}

.order-price {
 font-weight: bold;
}

.order-payment {
 color: #666;
 font-size: 0.9rem;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
 .order-section {
   grid-template-columns: 1.5fr 1fr;
 }
}

@media (max-width: 768px) {
 .container {
   padding: 1rem;
 }

 .order-section {
   grid-template-columns: 1fr;
 }

 .cart-section {
   position: static;
   margin-top: 2rem;
 }

 .menu-grid {
   grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
 }

 .order-content {
   flex-direction: column;
   align-items: flex-start;
   gap: 0.5rem;
 }
}

@media (max-width: 480px) {
 .menu-grid {
   grid-template-columns: 1fr;
 }
 
 .category-tabs {
   flex-wrap: wrap;
 }
 
 .cart-items {
   max-height: 300px;
 }
}
</style>