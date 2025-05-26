<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const visitorId = ref('');
const router = useRouter();
// 허용된 visitorId 목록
const ALLOWED_IDS = [
  '0c07db1e97c10dd364d0c7c97d8ebf5e',
  '5067475d1c7a690eb128aa0806366f71'
];

// 라우트 배열에서 메인 페이지(`/`)를 제외한 라우트만 필터링
const filteredRoutes = router.options.routes.filter(route => route.path !== '/');

function navigateTo(path) {
  router.push(path);
}

// visitorId가 허용된 ID인지 여부 판단
const isAllowed = computed(() => ALLOWED_IDS.includes(visitorId.value));

onMounted(async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  visitorId.value = result.visitorId;
});
</script>

<template>
  <div>
    <!-- visitorId 일치할 때만 전체 UI 렌더링 -->
    <template v-if="isAllowed">
      <div class="main-page">
        <h1>도구 목록</h1>
        <div class="button-container">
          <v-btn v-for="route in filteredRoutes" :key="route.path" class="nav-button" @click="navigateTo(route.path)">
            {{ route.comment }}
          </v-btn>
        </div>
      </div>
    </template>

    <!-- 그 외 visitorId만 표시 -->
    <div class="visitor-id-overlay">
      {{ visitorId }}
    </div>
  </div>
</template>

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

.visitor-id-overlay {
  position: fixed;
  bottom: 5px;
  right: 10px;
  font-size: 9px;
  color: #888;
  z-index: 999;
}
</style>
