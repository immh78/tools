<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const visitorId = ref('');
const router = useRouter();
// 허용된 visitorId 목록
const ALLOWED_IDS = [
  '0c07db1e97c10dd364d0c7c97d8ebf5e',
  '5067475d1c7a690eb128aa0806366f71',
  'bc0f8e17b63badde366f133fe707f57f',
  '91cb2a05340782fc6626678fce9f9e31',
  '7f6ae5b56dbdeef4bda8080a2882e221', //사무실 dev모드
  'a063076051e74e11fc092822b3b64557'
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
  <template v-if="isAllowed">
    <div class="main-page">
      <h1>도구 목록</h1>
      <div class="icon-grid">
        <div v-for="route in filteredRoutes" :key="route.path" class="icon-item" @click="navigateTo(route.path)">
          <v-icon size="36">{{ route.icon }}</v-icon>
          <small>{{ route.comment }}</small>
        </div>
        <div class="icon-item">
          <v-btn icon :href="'https://console.firebase.google.com/u/0/project/my-firebase-9450e/database/my-firebase-9450e-default-rtdb/data'" target="_blank">
            <v-icon>mdi-fire</v-icon>
          </v-btn>
          <small>Firebase</small>
        </div>
        <div class="icon-item">
          <v-btn icon :href="'https://github.com/immh78/vite-project'" target="_blank">
            <v-icon>mdi-github</v-icon>
          </v-btn>
          <small>GitHub</small>
        </div>
      </div>
    </div>
  </template>

  <div class="visitor-id-overlay">
    {{ visitorId }}
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

 .icon-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  justify-items: center;
  margin-top: 30px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 100px;
  text-align: center;
  transition: transform 0.2s;
}

.icon-item:hover {
  transform: scale(1.1);
}

.icon-item small {
  margin-top: 5px;
  font-size: 13px;
  color: #666;
}
 
}
</style>
