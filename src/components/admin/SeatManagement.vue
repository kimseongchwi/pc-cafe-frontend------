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
          <div class="start-time">{{ formatStartTime(seat.start_time) }}</div>
        </div>
        <span v-else class="status">빈좌석</span>
      </div>
    </div>

    <div v-if="showMenu" 
         class="context-menu"
         :style="{ top: menuY + 'px', left: menuX + 'px' }">
      <div class="menu-item" @click="showTimeChargePopup = true">시간 충전</div>
      <div class="menu-item" @click="showTimeRemovePopup = true">시간 제거</div>
    </div>

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
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
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
      
      event.preventDefault();
      this.showMenu = true;
      this.menuX = event.clientX;
      this.menuY = event.clientY;
      this.selectedSeat = seat;
    },
    handleClickOutside(event) {
      if (this.showMenu && !this.$el.contains(event.target)) {
        this.showMenu = false;
      }
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
          alert(`${this.selectedSeat.user_name}님에게 ${hours}시간을 충전하였습니다.`);
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
          alert(`${this.selectedSeat.user_name}님의 시간을 ${this.removeTimeAmount}분 제거하였습니다.`);
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
  gap: 20px; /* HomePage와 동일한 간격 */
  margin-top: 1rem;
  justify-content: center;
}

.seat {
  position: relative;
  border: 1px solid #ccc; /* HomePage와 동일한 테두리 */
  padding: 30px 20px; /* HomePage와 동일한 패딩 */
  text-align: center;
  border-radius: 8px;
  cursor: pointer; /* HomePage와 동일한 커서 */
  background-color: #f5f5f5; /* HomePage와 동일한 배경색 */
  height: 85px; /* HomePage와 동일한 높이 */
  width: 130px; /* HomePage와 동일한 너비 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  transition: background-color 0.3s ease, transform 0.3s ease; /* HomePage와 동일한 전환 효과 */
}

.seat:hover {
  background-color: #e0e0e0; /* HomePage와 동일한 호버 배경색 */
  transform: scale(1.05); /* HomePage와 동일한 호버 효과 */
}

.seat.occupied {
  background-color: #ff6b6b; /* HomePage와 동일한 점유된 좌석 배경 */
  color: white;
}

.seat-number {
  position: absolute;
  top: 5px; /* HomePage와 동일한 위치 */
  left: 5px; /* HomePage와 동일한 위치 */
  font-size: 12px; /* HomePage와 동일한 글씨 크기 */
  color: #333; /* HomePage와 동일한 색상 */
  font-weight: bold;
  opacity: 0.8;
}

.seat-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px; /* HomePage와 동일한 글씨 크기 */
  width: 100%;
}

.user-name {
  position: relative; /* 위치 조정을 위해 추가 */
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 14px;
  top: 11px; /* 아래로 내리기 위해 추가 */
}

.remaining-time {
  position: absolute;
  top: 5px; /* HomePage와 동일한 위치 */
  right: 5px; /* HomePage와 동일한 위치 */
  font-size: 12px; /* HomePage와 동일한 글씨 크기 */
  color: #333; /* HomePage와 동일한 색상 */
  opacity: 0.8;
}

.start-time {
  position: relative; /* 위치 조정을 위해 추가 */
  font-size: 12px;
  color: white;
  bottom: -9px; /* 아래로 내리기 위해 조정 */
}

.status {
  font-size: 16px; /* HomePage와 동일한 글씨 크기 */
  font-weight: bold;
  white-space: nowrap;
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