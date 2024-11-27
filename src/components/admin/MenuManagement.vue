<template>
  <div class="menu-management">
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
  name: 'MenuManagement',
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
    }
  },
  methods: {
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
        
        this.$emit('refresh-menus');
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

        this.$emit('refresh-menus');
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
        this.$emit('refresh-menus');
      } catch (error) {
        console.error('메뉴 삭제 실패:', error);
        alert('메뉴 삭제에 실패했습니다.');
      }
    }
  }
}
</script>

<style scoped>
.menu-management {
  width: 100%;
}

.add-menu-section, 
.menu-list-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.category-tabs {
  display: flex;
  gap: 1rem;  /* 버튼 사이 간격 */
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;  /* 상하 여백 추가 */
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
  z-index: 1000;
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

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
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
  margin-top: 2rem;
}

.menu-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.button-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .menu-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style> 