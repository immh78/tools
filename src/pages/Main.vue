<template>
  <div class="main-page">
    <h1>도구 목록</h1>
    <div class="button-container">
      <v-btn
        v-for="route in filteredRoutes"
        :key="route.path"
        class="nav-button"
        @click="navigateTo(route.path)"
      >
        {{ route.comment }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// 라우트 배열에서 메인 페이지(`/`)를 제외한 라우트만 필터링
const filteredRoutes = router.options.routes.filter(route => route.path !== '/');

function navigateTo(path) {
  router.push(path);
}
</script>

<style scoped>
.main-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

.button-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.nav-button {
  width: 300px;
  font-size: 16px;
}
</style>