<template>
  <div class="seat-management">
    <h2>좌석 관리</h2>
    <div class="seat-container">
      <div v-for="seat in seats" 
           :key="seat.number" 
           class="seat"
           :class="{ 'occupied': seat.registerid }"
           @contextmenu.prevent="showContextMenu($event, seat)">
        <span class="seat-number">{{ seat.number }}번</span>
        <div class="seat-info" v-if="seat.registerid">
          <div class="user-name">{{ seat.user_name }}</div>
          <div class="remaining-time">{{ formatTime(seat.available_time) }}</div>
          <div class="start-time">{{ formatStartTime(seat.start_time) }}</div> <!-- 시작 시간 표시 -->
        </div>
        <span v-else class="status">빈좌석</span>
      </div>
    </div>

    <!-- 컨텍스트 메뉴 -->
    <div v-if="showMenu" 
         class="context-menu"
         :style="{ top: menuY + 'px', left: menuX + 'px' }">
      <div class="menu-item" @click="showTimeChargePopup = true">시간 충전</div>
      <div class="menu-item" @click="showTimeRemovePopup = true">시간 제거</div>
    </div>

    <!-- 시간 충전 팝업 -->
    <div v-if="showTimeChargePopup" class="popup">
      <div class="popup-content">
        <h3>시간 충전</h3>
        <div v-for="(price, hours) in timeOptions" 
             :key="hours" 
             class="time-option">
          <button @click="chargeTime(hours)">
            {{ hours }}시간 - {{ price }}원
          </button>
        </div>
        <button @click="showTimeChargePopup = false" class="close-button">
          닫기
        </button>
      </div>
    </div>

    <!-- 시간 제거 팝업 -->
    <div v-if="showTimeRemovePopup" class="popup">
      <div class="popup-content">
        <h3>시간 제거</h3>
        <div class="time-input">
          <input type="number" 
                 v-model="removeTimeAmount" 
                 placeholder="제거할 시간(분)">
        </div>
        <button @click="removeTime" class="action-button">확인</button>
        <button @click="showTimeRemovePopup = false" class="close-button">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SeatManagement',
  props: {
    seats: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      showMenu: false,
      menuX: 0,
      menuY: 0,
      selectedSeat: null,
      showTimeChargePopup: false,
      showTimeRemovePopup: false,
      removeTimeAmount: '',
      timeOptions: {
        1: 1000,
        2: 2000,
        3: 3000,
        5: 5000,
        10: 10000,
        50: 50000,
        100: 100000
      }
    }
  },
  methods: {
    formatTime(seconds) {
      if (!seconds) return '0분';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
    },
    formatStartTime(startTime) {
      if (!startTime) return '';
      const date = new Date(startTime);
      const yy = String(date.getFullYear()).slice(-2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const ss = String(date.getMinutes()).padStart(2, '0');
      return `${yy}${mm}${dd}-${hh}:${ss}`;
    },
    showContextMenu(event, seat) {
      if (!seat.registerid) return;
      
      event.preventDefault(); // 기본 컨텍스트 메뉴 방지
      this.showMenu = true;
      this.menuX = event.clientX;
      this.menuY = event.clientY;
      this.selectedSeat = seat;
    },
    async chargeTime(hours) {
      try {
        const response = await axios.post(`/api/admin/charge-time/${this.selectedSeat.number}`, {
          hours
        }, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        });
        
        if (response.data.success) {
          this.$emit('refresh-seats');
          this.showTimeChargePopup = false;
          this.showMenu = false;
          alert(`${hours}시간을 충전하였습니다.`);
        }
      } catch (error) {
        console.error('시간 충전 실패:', error);
        alert('시간 충전에 실패했습니다.');
      }
    },
    async removeTime() {
      if (!this.removeTimeAmount || this.removeTimeAmount <= 0) {
        alert('유효한 시간을 입력해주세요.');
        return;
      }

      try {
        const response = await axios.post(`/api/admin/remove-time/${this.selectedSeat.number}`, {
          minutes: this.removeTimeAmount
        }, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        });

        if (response.data.success) {
          this.$emit('refresh-seats');
          this.showTimeRemovePopup = false;
          this.showMenu = false;
          alert(`${this.removeTimeAmount}분을 제거하였습니다.`);
        }
      } catch (error) {
        console.error('시간 제거 실패:', error);
        alert('시간 제거에 실패했습니다.');
      }
    }
  }
}
</script>

<style scoped>
.seat-management {
  padding: 20px;
}

.seat-container {
  display: grid;
  grid-template-columns: repeat(7, 1fr); /* 7개의 열로 설정 */
  gap: 12px;
  margin-top: 1rem;
  justify-content: center;
}

.seat {
  position: relative;
  border: 1px solid #ddd;
  padding: 15px;
  text-align: center;
  border-radius: 8px;
  cursor: context-menu;
  background-color: #90EE90;
  height: 80px;
  width: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
}

.seat.occupied {
  background-color: #FF6B6B;
  color: white;
}

.seat-number {
  position: absolute;
  top: 3px;
  left: 3px;
  font-size: 11px;
}

.seat-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  width: 100%;
}

.user-name {
  font-weight: bold;
  margin-bottom: 2px;
  font-size: 14px;
}

.remaining-time {
  font-size: 12px;
}

.start-time {
  font-size: 10px;
  color: white;
}

.status {
  font-size: 14px;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 0;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 1000;
}

.menu-item {
  padding: 8px 20px;
  cursor: pointer;
  white-space: nowrap;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
}

.time-option {
  margin: 10px 0;
}

.time-option button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

.time-option button:hover {
  background-color: #0056b3;
}

.time-input input {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.action-button, .close-button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.action-button {
  background-color: #28a745;
  color: white;
}

.close-button {
  background-color: #6c757d;
  color: white;
}

/* 반응형 디자인 수정 */
@media (max-width: 1200px) {
  .seat-container {
    grid-template-columns: repeat(4, 1fr);
    max-width: 900px;
    margin: 1rem auto;
  }
}

@media (max-width: 992px) {
  .seat-container {
    grid-template-columns: repeat(3, 1fr);
    max-width: 700px;
  }
}

@media (max-width: 768px) {
  .seat-container {
    grid-template-columns: repeat(2, 1fr);
    max-width: 500px;
  }
}

@media (max-width: 576px) {
  .seat-container {
    grid-template-columns: repeat(1, 1fr);
    max-width: 300px;
  }
  
  .seat {
    width: 100%;
    max-width: 200px;
  }
}
</style>