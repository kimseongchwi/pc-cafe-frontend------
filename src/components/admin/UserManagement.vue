<template>
  <div class="user-management">
    <input v-model="searchQuery" placeholder="이름, 아이디 또는 전화번호 뒷자리 검색" class="search-input" />
    <table class="user-table">
      <thead>
        <tr>
          <th>이름</th>
          <th>아이디</th>
          <th>전화번호</th>
          <th>가입 날짜</th>
          <th>유형</th>
          <th>남은 시간</th>
          <th>비밀번호 초기화</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.registerid }}</td>
          <td>{{ user.phone_number }}</td>
          <td>{{ formatDate(user.created_at) }}</td>
          <td>{{ user.role }}</td>
          <td>{{ formatTime(user.available_time) }}</td>
          <td>
            <button @click="$emit('reset-password', user.id)" class="reset-button">초기화</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  props: ['users'],
  data() {
    return {
      searchQuery: '',
      refreshInterval: null,
    }
  },
  computed: {
    filteredUsers() {
      return this.users.filter(user => 
        user.name.includes(this.searchQuery) || 
        user.registerid.includes(this.searchQuery) ||
        user.phone_number.endsWith(this.searchQuery) // 전화번호 뒷자리 검색
      ).map(user => {
        return {
          ...user,
          role: user.role === 'user' ? '사용자' : user.role
        };
      });
    }
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const ss = String(date.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} / ${hh}:${ss}`;
    },
    formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}시간 ${minutes}분`;
    },
    refreshUsers() {
      this.$emit('refresh-users');
    }
  },
  mounted() {
    this.refreshInterval = setInterval(this.refreshUsers, 2000);
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  }
}
</script>

<style scoped>
.user-management {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.search-input {
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  width: 100%;
  max-width: 300px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.user-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 1rem;
}

.user-table th,
.user-table td {
  padding: 1rem;
  text-align: center;
  vertical-align: middle;
}

.user-table th {
  background-color: #f4f4f4;
  color: #333;
  font-weight: bold;
}

.user-table tr {
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.reset-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.reset-button:hover {
  background-color: #0056b3;
}

/* 모바일 반응형 스타일 */
@media (max-width: 768px) {
  .user-table {
    display: block;
    overflow-x: auto;
  }

  .user-table th,
  .user-table td {
    min-width: 100px;
    padding: 0.8rem;
  }
}
</style>