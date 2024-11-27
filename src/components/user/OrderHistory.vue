<template>
    <div class="history-section">
      <div class="order-header">
        <h2>주문 내역</h2>
        <div class="order-filters">
          <select v-model="statusFilter" class="filter-select">
            <option value="all">전체 주문</option>
            <option value="pending">주문 접수</option>
            <option value="processing">처리중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>
      </div>
  
      <div class="order-list">
        <div class="order-group" v-for="(groupOrders, date) in groupedOrders" :key="date">
          <h3 class="date-header">{{ formatDateHeader(date) }}</h3>
          <div v-for="order in groupOrders" :key="order.id" class="order-item">
            <div class="order-header">
              <span class="order-time">{{ formatTime(order.created_at) }}</span>
              <span class="order-status" :class="order.status">
                {{ getStatusText(order.status) }}
              </span>
            </div>
            <div class="order-content">
              <div class="order-menu">
                <span class="menu-name">{{ order.menuName }}</span>
                <span class="order-quantity">{{ order.quantity }}개</span>
              </div>
              <div class="order-price">
                {{ (order.price * order.quantity).toLocaleString() }}원
              </div>
            </div>
            <div class="order-footer">
              <span class="order-payment">
                결제 방식: {{ order.payment_method === 'card' ? '카드' : '현금' }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="filteredOrders.length === 0" class="empty-order-list">
          <p>주문 내역이 없습니다.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'OrderHistory',
    props: {
      orders: {
        type: Array,
        required: true
      }
    },
    data() {
      return {
        statusFilter: 'all',
        refreshInterval: null
      }
    },
    computed: {
      filteredOrders() {
        if (this.statusFilter === 'all') {
          return this.orders;
        }
        return this.orders.filter(order => order.status === this.statusFilter);
      },
      groupedOrders() {
        const groups = {};
        this.filteredOrders.forEach(order => {
          const date = new Date(order.created_at).toLocaleDateString();
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(order);
        });
        return groups;
      }
    },
    methods: {
      formatDateHeader(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
  
        if (date.toDateString() === today.toDateString()) {
          return '오늘';
        } 
        return dateString;
      },
      formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      },
      formatDate(dateString) {
        return new Date(dateString).toLocaleString();
      },
      getStatusText(status) {
        const statusMap = {
          'pending': '주문 접수',
          'processing': '처리중',
          'completed': '완료',
          'cancelled': '취소'
        };
        return statusMap[status] || status;
      }
    },
    mounted() {
      // 3초마다 주문 목록 새로고침
      this.refreshInterval = setInterval(() => {
        this.$emit('refresh-orders');
      }, 3000);
    },
    beforeUnmount() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    }
  }
  </script>
  
  <style scoped>
  .history-section {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .order-filters {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .filter-select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 120px;
  }
  
  .date-header {
    padding: 1rem 0;
    margin: 1rem 0;
    border-bottom: 2px solid #eee;
    color: #666;
  }
  
  .order-item {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .order-time {
    color: #666;
    font-size: 0.9rem;
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
    margin: 1rem 0;
    padding: 0.5rem 0;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
  }
  
  .menu-name {
    font-weight: bold;
  }
  
  .order-menu {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .order-quantity {
    color: #666;
    font-size: 0.9rem;
  }
  
  .order-price {
    font-weight: bold;
    color: #007bff;
  }
  
  .order-footer {
    color: #666;
    font-size: 0.9rem;
  }
  
  .empty-order-list {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  
  @media (max-width: 768px) {
    .order-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
  
    .order-filters {
      flex-direction: column;
    }
  
    .filter-select {
      width: 100%;
    }
  
    .refresh-button {
      width: 100%;
    }
  }
  </style>