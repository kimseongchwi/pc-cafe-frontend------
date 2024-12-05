<template>
  <div class="order-section">
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
        <h2>주문 리스트</h2>
        
        <div v-if="cartItems.length === 0" class="empty-cart">
          <p>리스트가 비어있습니다</p>
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
</template>

<script>
import axios from 'axios'

export default {
  name: 'OrderMenu',
  props: {
    menus: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      selectedCategory: 'all',
      categories: ['식사', '라면', '음료', '과자'],
      quantities: {},
      paymentMethod: 'card',
      seatNumber: sessionStorage.getItem('seatNumber') || null,
      refreshInterval: null
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
  created() {
    // 컴포넌트가 생성될 때 2초마다 메뉴 새로고침
    this.refreshInterval = setInterval(() => {
      this.$emit('refresh-menus');
    }, 2000);
  },
  beforeUnmount() {
    // 컴포넌트가 제거될 때 인터벌 정리
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
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
    async placeOrder() {
      try {
        const token = sessionStorage.getItem('token');
        
        // 각 메뉴 아이템별로 개별 주문 요청 보내기
        const orderPromises = this.cartItems.map(menu => {
          const orderData = {
            menuId: menu.id,
            quantity: this.quantities[menu.id],
            paymentMethod: this.paymentMethod,
            seatNumber: this.seatNumber
          };

          return axios.post('/api/orders', orderData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        });

        // 모든 주문 요청 처리 대기
        await Promise.all(orderPromises);

        // 장바구니 초기화
        this.quantities = {};
        this.paymentMethod = 'card';
        
        // 부모 컴포넌트에 주문 완료 알림
        this.$emit('order-placed');
        
        alert('주문이 완료되었습니다!');
      } catch (error) {
        console.error('주문 실패:', error.response?.data || error.message);
        alert(`주문에 실패했습니다: ${error.response?.data?.message || '서버 오류가 발생했습니다.'}`);
      }
    }
  }
}
</script>

<style scoped>
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
  border-bottom: 1px solid #eee;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background-color: #f8f9fa;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 500;
  min-width: 80px;
  white-space: nowrap;
}

.tab-button:hover {
  background-color: #e9ecef;
  color: #333;
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
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.menu-card:hover {
  transform: translateY(-5px);
}

.menu-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.menu-info {
  padding: 1rem;
}

.menu-info h3 {
  margin: 0 0 0.5rem 0;
}

.menu-price {
  color: #007bff;
  font-weight: bold;
  margin: 0.5rem 0;
}

.menu-category {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
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

@media (max-width: 1024px) {
  .order-section {
    grid-template-columns: 1.5fr 1fr;
  }
}

@media (max-width: 768px) {
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
}

@media (max-width: 480px) {
  .menu-grid {
    grid-template-columns: 1fr;
  }
  
  .category-tabs {
    justify-content: flex-start;
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }

  .tab-button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    min-width: 70px;
  }
  
  .cart-items {
    max-height: 300px;
  }
}
</style>