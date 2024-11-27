<template>
    <div class="admin-dashboard">
      <header class="header">
        <h1>PC방 관리자</h1>
        <div class="admin-tabs">
          <button 
            class="tab-button"
            :class="{ active: currentTab === 'menu' }"
            @click="currentTab = 'menu'"
          >
            메뉴 관리
          </button>
          <button 
            class="tab-button"
            :class="{ active: currentTab === 'orders' }"
            @click="currentTab = 'orders'"
          >
          주문 관리({{ orders.length }})
    </button>
    <div class="user-info">
      <span>{{ name }} 님</span>
      <button @click="logout" class="logout-button">로그아웃</button>
    </div>
  </div>
      </header>
  
      <div class="container">
        <!-- 메뉴 관리 -->
        <div v-if="currentTab === 'menu'" class="menu-management">
          <!-- 메뉴 추가 폼 -->
          <div class="add-menu-section">
            <h2>새 메뉴 추가</h2>
            
            <!-- 이미지 업로드 영역 -->
            <div class="form-group">
              <label>메뉴 이미지</label>
              <div class="image-upload-area">
                <img 
                  v-if="imagePreview" 
                  :src="imagePreview" 
                  class="image-preview"
                  alt="메뉴 이미지 미리보기"
                >
                <div 
                  v-else 
                  class="image-placeholder"
                >
                  이미지를 선택해주세요
                </div>
                <input 
                  type="file" 
                  @change="handleImageChange" 
                  accept="image/*"
                  class="input"
                  ref="fileInput"
                >
              </div>
            </div>
  
            <div class="form-group">
              <label>메뉴명</label>
              <input 
                type="text"
                v-model="newMenu.name"
                placeholder="메뉴명을 입력하세요"
                class="input"
              >
            </div>
            
            <div class="form-group">
              <label>가격</label>
              <input 
                type="number"
                v-model="newMenu.price"
                placeholder="가격을 입력하세요"
                class="input"
              >
            </div>
  
            <div class="form-group">
              <label>카테고리</label>
              <select v-model="newMenu.category" class="input">
                <option value="식사">식사</option>
                <option value="라면">라면</option>
                <option value="음료">음료</option>
                <option value="과자">과자</option>
              </select>
            </div>
  
            <button @click="addMenu" class="button button-primary">
              메뉴 추가
            </button>
          </div>
  
          <!-- 메뉴 목록 섹션 -->
          <div class="menu-list-section">
            <h2>메뉴 목록</h2>
            
            <!-- 카테고리 탭 -->
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
                  <div class="menu-actions">
                    <button @click="startEdit(menu)" class="button button-small button-edit">
                      수정
                    </button>
                    <button @click="deleteMenu(menu.id)" class="button button-small button-delete">
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- 메뉴가 없을 때 -->
            <div v-if="filteredMenus.length === 0" class="no-menu">
              <p>해당 카테고리의 메뉴가 없습니다.</p>
            </div>
          </div>
        </div>
  
        <!-- 주문 관리 -->
        <div v-if="currentTab === 'orders'" class="order-management">
          <div class="order-header">
            <h2>주문 관리</h2>
            <button @click="fetchOrders" class="refresh-button">
              새로고침
            </button>
          </div>
          <div class="order-list">
            <div class="order-filters">
              <select v-model="orderStatusFilter" class="filter-select">
                <option value="all">전체 주문</option>
                <option value="pending">대기 중</option>
                <option value="processing">처리 중</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
  
            <table class="order-table">
              <thead>
                <tr>
                  <th>주문 시간</th>
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
                <tr v-for="order in filteredOrders" :key="order.id">
                  <td>{{ formatDate(order.created_at) }}</td>
                  <td>{{ order.username }}</td>
                  <td>{{ order.menuName }}</td>
                  <td>{{ order.quantity }}</td>
                  <td>{{ (order.price * order.quantity).toLocaleString() }}원</td>
                  <td>{{ order.payment_method === 'card' ? '카드' : '현금' }}</td>
                  <td>
                    <span class="status-badge" :class="order.status">
                      {{ getStatusText(order.status) }}
                    </span>
                  </td>
                  <td>
                    <select 
                      v-model="order.status" 
                      @change="updateOrderStatus(order.id, order.status)"
                      class="status-select"
                    >
                      <option value="pending">대기 중</option>
                      <option value="processing">처리 중</option>
                      <option value="completed">완료</option>
                      <option value="cancelled">취소</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
  
            <div v-if="filteredOrders.length === 0" class="no-orders">
              <p>해당하는 주문이 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 수정 모달 -->
      <div v-if="editingMenu" class="modal-backdrop">
        <div class="modal">
          <h2>메뉴 수정</h2>
          
          <!-- 이미지 수정 영역 -->
          <div class="form-group">
            <label>메뉴 이미지</label>
            <div class="image-upload-area">
              <img 
                v-if="editImagePreview" 
                :src="editImagePreview" 
                class="image-preview"
                alt="메뉴 이미지 미리보기"
              >
              <div v-else class="image-placeholder">
                이미지를 선택해주세요
              </div>
              <input 
                type="file" 
                @change="handleEditImageChange" 
                accept="image/*"
                class="input"
                ref="editFileInput"
              >
            </div>
          </div>
  
          <div class="form-group">
            <label>메뉴명</label>
            <input 
              type="text"
              v-model="editingMenu.name"
              class="input"
            >
          </div>
          
          <div class="form-group">
            <label>가격</label>
            <input 
              type="number"
              v-model="editingMenu.price"
              class="input"
            >
          </div>
  
          <div class="form-group">
            <label>카테고리</label>
            <select v-model="editingMenu.category" class="input">
              <option value="식사">식사</option>
              <option value="라면">라면</option>
              <option value="음료">음료</option>
              <option value="과자">과자</option>
            </select>
          </div>
  
          <div class="modal-buttons">
            <button @click="updateMenu" class="button button-primary">
              저장
            </button>
            <button @click="cancelEdit" class="button">
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  
  export default {
    name: 'AdminDashboard',
    data() {
      return {
        name: '',  // 추가
        currentTab: 'menu',
        orderStatusFilter: 'all',
        orders: [],
        menus: [],
        selectedCategory: 'all',
        categories: ['식사', '라면', '음료', '과자'],
        newMenu: {
          name: '',
          price: '',
          category: '식사'
        },
        editingMenu: null,
        imageFile: null,
        imagePreview: null,
        editImageFile: null,
        editImagePreview: null
      }
    },
    computed: {
      filteredMenus() {
        if (this.selectedCategory === 'all') {
          return this.menus;
        }
        return this.menus.filter(menu => menu.category === this.selectedCategory);
      },
      filteredOrders() {
        if (this.orderStatusFilter === 'all') {
          return this.orders;
        }
        return this.orders.filter(order => order.status === this.orderStatusFilter);
      }
    },
    methods: {
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
    }
  },
      formatDate(dateString) {
        return new Date(dateString).toLocaleString();
      },
      getStatusText(status) {
        const statusMap = {
          'pending': '대기 중',
          'processing': '처리 중',
          'completed': '완료',
          'cancelled': '취소됨'
        };
        return statusMap[status] || status;
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
          alert('주문 목록을 불러오는데 실패했습니다.');
        }
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
          await this.fetchOrders();
        } catch (error) {
          console.error('주문 상태 업데이트 실패:', error);
          alert('주문 상태 변경에 실패했습니다.');
        }
      },
      handleImageChange(event) {
        const file = event.target.files[0];
        if (file) {
          this.imageFile = file;
          this.imagePreview = URL.createObjectURL(file);
        }
      },
      handleEditImageChange(event) {
        const file = event.target.files[0];
        if (file) {
          this.editImageFile = file;
          this.editImagePreview = URL.createObjectURL(file);
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
    console.error('메뉴 로딩 실패:', error);
  }
},

async addMenu() {
  if (!this.newMenu.name || !this.newMenu.price) {
    alert('메뉴명과 가격을 모두 입력해주세요.');
    return;
  }

  try {
    const token = sessionStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', this.newMenu.name);
    formData.append('price', this.newMenu.price);
    formData.append('category', this.newMenu.category);
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }

    await axios.post('/api/menus', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    await this.fetchMenus();
    this.newMenu = {
      name: '',
      price: '',
      category: '식사'
    };
    this.imageFile = null;
    this.imagePreview = null;
    if (this.$refs.fileInput) {
      this.$refs.fileInput.value = '';
    }
    alert('메뉴가 추가되었습니다.');
  } catch (error) {
    console.error('메뉴 추가 실패:', error);
    alert(error.response?.data?.message || '메뉴 추가에 실패했습니다.');
  }
},
      startEdit(menu) {
        this.editingMenu = { ...menu };
        this.editImagePreview = menu.imageUrl;
      },
      async updateMenu() {
        if (!this.editingMenu.name || !this.editingMenu.price) {
          alert('메뉴명과 가격을 모두 입력해주세요.');
          return;
        }
  
        try {
          const token = sessionStorage.getItem('token');
 const formData = new FormData();
 formData.append('name', this.editingMenu.name);
 formData.append('price', this.editingMenu.price);
 formData.append('category', this.editingMenu.category);
 if (this.editImageFile) {
   formData.append('image', this.editImageFile);
 }

 await axios.put(
   `/api/menus/${this.editingMenu.id}`,
   formData,
   {
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'multipart/form-data'
     }
   }
 );
 
 this.fetchMenus();
 this.editingMenu = null;
 this.editImageFile = null;
 this.editImagePreview = null;
} catch (error) {
 console.error('메뉴 수정 실패:', error);
 alert('메뉴 수정에 실패했습니다.');
}
},

cancelEdit() {
 this.editingMenu = null;
 this.editImageFile = null;
 this.editImagePreview = null;
},

async deleteMenu(id) {
 if (!confirm('정말 삭제하시겠습니까?')) return;

 try {
   const token = sessionStorage.getItem('token');
   await axios.delete(`/api/menus/${id}`, {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   this.fetchMenus();
 } catch (error) {
   console.error('메뉴 삭제 실패:', error);
   alert('메뉴 삭제에 실패했습니다.');
 }
},

logout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('userName');
  this.$router.push('/');
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
.admin-dashboard {
 min-height: 100vh;
 background-color: #f5f5f5;
}

.header {
 background-color: #333;
 color: white;
 padding: 1rem;
 text-align: center;
}

.admin-tabs {
 display: flex;
 justify-content: center;
 gap: 1rem;
 margin-top: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: absolute;
  right: 1rem;
  top: 1rem;
}

.user-info span {
  color: white;
}

.logout-button {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.container {
 max-width: 1200px;
 margin: 0 auto;
 padding: 2rem;
}

.order-header {
 display: flex;
 justify-content: space-between;
 align-items: center;
 margin-bottom: 1rem;
}

.refresh-button {
 padding: 0.5rem 1rem;
 background-color: #28a745;
 color: white;
 border: none;
 border-radius: 4px;
 cursor: pointer;
}

.add-menu-section, 
.menu-list-section,
.order-management {
 background: white;
 padding: 2rem;
 border-radius: 8px;
 box-shadow: 0 2px 4px rgba(0,0,0,0.1);
 margin-bottom: 2rem;
}

.category-tabs,
.order-filters {
 margin-bottom: 1.5rem;
}

.tab-button {
 padding: 0.75rem 1.5rem;
 border: none;
 border-radius: 4px;
 background-color: #f8f9fa;
 color: #495057;
 cursor: pointer;
 transition: all 0.2s ease;
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
 transition: transform 0.2s;
}

.menu-image {
 width: 100%;
 height: 200px;
 object-fit: cover;
}

.menu-info {
 padding: 1rem;
}

.status-badge {
 display: inline-block;
 padding: 0.25rem 0.75rem;
 border-radius: 20px;
 font-size: 0.9rem;
}

.status-badge.pending { background-color: #ffd700; }
.status-badge.processing { background-color: #007bff; color: white; }
.status-badge.completed { background-color: #28a745; color: white; }
.status-badge.cancelled { background-color: #dc3545; color: white; }

.order-table {
 width: 100%;
 border-collapse: collapse;
 margin-top: 1rem;
}

.order-table th,
.order-table td {
 padding: 1rem;
 text-align: left;
 border-bottom: 1px solid #dee2e6;
}

.image-upload-area {
 border: 2px dashed #ddd;
 padding: 1rem;
 text-align: center;
 margin-bottom: 1rem;
 border-radius: 4px;
}

.image-preview {
 max-width: 200px;
 max-height: 200px;
 margin-bottom: 1rem;
}

.modal-backdrop {
 position: fixed;
 top: 0;
 left: 0;
 width: 100%;
 height: 100%;
 background-color: rgba(0, 0, 0, 0.5);
 display: flex;
 justify-content: center;
 align-items: center;
}

.modal {
 background: white;
 padding: 2rem;
 border-radius: 8px;
 width: 90%;
 max-width: 500px;
}

.button {
 padding: 0.5rem 1rem;
 border: none;
 border-radius: 4px;
 cursor: pointer;
 transition: all 0.2s ease;
}

.button-primary {
 background-color: #007bff;
 color: white;
}

.button-edit {
 background-color: #28a745;
 color: white;
}

.button-delete {
 background-color: #dc3545;
 color: white;
}

@media (max-width: 768px) {
 .menu-grid {
   grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
 }
 
 .order-table {
   display: block;
   overflow-x: auto;
 }
}
</style>