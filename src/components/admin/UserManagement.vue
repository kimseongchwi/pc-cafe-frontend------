<template>
    <div class="user-management">
      <input v-model="searchQuery" placeholder="이름 또는 아이디 검색" class="search-input" />
      <table class="user-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>아이디</th>
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
        refreshInterval: null, // 새로고침 간격을 저장할 변수 추가
      }
    },
    computed: {
  filteredUsers() {
    return this.users.filter(user => 
      user.name.includes(this.searchQuery) || 
      user.registerid.includes(this.searchQuery)
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
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ko-KR', options);
      },
      formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}시간 ${minutes}분`;
      },
      refreshUsers() {
        // 사용자 목록을 새로고침하는 로직을 여기에 추가
        this.$emit('refresh-users'); // 부모 컴포넌트에서 사용자 목록을 갱신하도록 이벤트 발생
      }
    },
    mounted() {
      this.refreshInterval = setInterval(this.refreshUsers, 2000); // 2초마다 refreshUsers 호출
    },
    beforeUnmount() {
      clearInterval(this.refreshInterval); // 컴포넌트가 파괴되기 전에 인터벌 제거
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