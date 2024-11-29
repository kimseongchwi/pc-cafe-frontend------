<template>
    <div class="order-management">
      <div class="order-header">
        <h2>주문 관리</h2>
      </div>
      <div class="order-list">
        <div class="order-filters">
          <select v-model="orderStatusFilter" class="filter-select">
            <option value="all">전체 주문</option>
            <option value="pending">접수중</option>
            <option value="processing">처리중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>
  
        <div v-for="(groupOrders, date) in groupedOrders" :key="date" class="order-group">
          <h3 class="date-header">{{ formatDateHeader(date) }}</h3>
          <table class="order-table">
  <thead>
    <tr>
      <th>주문 시간</th>
      <th>좌석 번호</th>  <!-- 새로 추가 -->
      <th>주문자</th>
      <th>메뉴</th>
      <th>수량</th>
      <th>금액</th>
      <th>결제 방식</th>
      <th>상태</th>
      <th>관리</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="order in groupOrders" :key="order.id">
      <td>{{ formatTime(order.created_at) }}</td>
      <td>{{ order.seat_number }}번</td>  <!-- 새로 추가 -->
      <td>{{ order.user_name }}</td>
      <td>{{ order.menuName }}</td>
      <td>{{ order.quantity }}</td>
      <td>{{ (order.price * order.quantity).toLocaleString() }}원</td>
      <td>{{ order.payment_method === 'card' ? '카드' : '현금' }}</td>
      <td>
        <span class="status-badge" :class="order.status">
          {{ getStatusText(order.status) }}
        </span>
      </td>
      <td class="status-buttons">
                  <button 
                    v-for="status in ['pending', 'processing', 'completed', 'cancelled']"
                    :key="status"
                    class="status-btn"
                    :class="{ [status]: true, active: order.status === status }"
                    @click="updateOrderStatus(order.id, status)"
                  >
                    {{ getStatusText(status) }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div v-if="filteredOrders.length === 0" class="no-orders">
          <p>해당하는 주문이 없습니다.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  
  export default {
    name: 'OrderManagement',
    props: {
      orders: {
        type: Array,
        required: true
      }
    },
    data() {
      return {
        orderStatusFilter: 'all',
        refreshInterval: null
      }
    },
    computed: {
      filteredOrders() {
        if (this.orderStatusFilter === 'all') {
          return this.orders;
        }
        return this.orders.filter(order => order.status === this.orderStatusFilter);
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
      getStatusText(status) {
        const statusMap = {
          'pending': '접수중',
          'processing': '처리중',
          'completed': '완료',
          'cancelled': '취소'
        };
        return statusMap[status] || status;
      },
      async updateOrderStatus(orderId, status) {
        try {
          const token = sessionStorage.getItem('token');
          await axios.put(
            `/api/orders/${orderId}`, 
            { status },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          // 주문 목록 새로고침
          this.$emit('refresh-orders');
        } catch (error) {
          console.error('주문 상태 업데이트 실패:', error);
          alert('주문 상태 변경에 실패했습니다.');
        }
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
.order-management {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.order-filters {
  margin-bottom: 1.5rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 150px;
}

.order-group {
  margin-bottom: 2rem;
}

.date-header {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #eee;
  color: #333;
}

.order-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 1rem;
}

.order-table tr {
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.order-table th,
.order-table td {
  padding: 1rem;
  text-align: center;  /* left에서 center로 변경 */
  vertical-align: middle;
}

.order-table th:first-child,
.order-table td:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.order-table th:last-child,
.order-table td:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  width: 300px;
  min-width: 300px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  white-space: nowrap;
  min-width: 70px;
  height: 24px;
}

.status-badge.pending { 
  background-color: #ffd700; 
}

.status-badge.processing { 
  background-color: #007bff; 
  color: white; 
}

.status-badge.completed { 
  background-color: #28a745; 
  color: white; 
}

.status-badge.cancelled { 
  background-color: #dc3545; 
  color: white; 
}

.status-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-start;
}

.status-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  opacity: 0.6;
  white-space: nowrap;
  flex: 1;
  min-width: 60px;
}

.status-btn.active {
  opacity: 1;
}

.status-btn.pending {
  background-color: #ffd700;
  color: #000;
}

.status-btn.processing {
  background-color: #007bff;
  color: white;
}

.status-btn.completed {
  background-color: #28a745;
  color: white;
}

.status-btn.cancelled {
  background-color: #dc3545;
  color: white;
}

.status-btn:hover {
  opacity: 0.8;
}

.status-btn.active:hover {
  opacity: 1;
}

.no-orders {
  text-align: center;
  padding: 2rem;
  color: #666;
}

@media (max-width: 768px) {
  .status-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.25rem;
  }
  
  .order-table {
    display: block;
    overflow-x: auto;
  }

  .order-table th,
  .order-table td {
    min-width: 120px;
    text-align: center;  /* left에서 center로 변경 */
  vertical-align: middle;
  }

  .order-table th:last-child,
  .order-table td:last-child {
    width: 200px;
    min-width: 200px;
  }
}
</style>