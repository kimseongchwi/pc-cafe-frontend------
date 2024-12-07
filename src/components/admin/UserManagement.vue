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
  padding: 1rem;
}

.search-input {
  margin-bottom: 1rem;
  padding: 0.5rem;
  width: 100%;
  max-width: 300px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th, .user-table td {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: left;
}

.user-table th {
  background-color: #f4f4f4;
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
</style>