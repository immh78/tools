<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router';

const info = ref('');
const isInfoPopup = ref(false);
const router = useRouter();

// 라우트 배열에서 메인 페이지(`/`)를 제외한 라우트만 필터링
const filteredRoutes = router.options.routes.filter(route => route.path !== '/');

function navigateTo(path) {
  router.push(path);
}

function getDeviceInfo() {
  const details = []

  details.push(`📱 User Agent: ${navigator.userAgent}\n`)
  details.push(`🖥 Platform: ${navigator.platform}\n`)
  details.push(`🈯 Language: ${navigator.language}`)
  details.push(`🌐 Languages: ${navigator.languages?.join(', ')}`)
  details.push(`💾 Device Memory: ${navigator.deviceMemory ?? 'N/A'} GB`)
  details.push(`⚙️ CPU Cores: ${navigator.hardwareConcurrency ?? 'N/A'}`)
  details.push(`🍪 Cookies Enabled: ${navigator.cookieEnabled}`)
  details.push(`📡 Online: ${navigator.onLine}`)
  details.push(`☕ Java Enabled: ${navigator.javaEnabled()}`)
  details.push(`🛠 Service Worker 지원: ${'serviceWorker' in navigator}`)
  details.push(`📋 Clipboard API 지원: ${'clipboard' in navigator}`)
  details.push(`📍 Geolocation 지원: ${'geolocation' in navigator}`)

  const connection = navigator.connection
  if (connection) {
    details.push(`📶 Network Info: type=${connection.effectiveType}, downlink=${connection.downlink}Mbps`)
  } else {
    details.push(`📶 Network Info: N/A`)
  }

  info.value = details; //details.join('\n')
  isInfoPopup.value = true;
}
</script>



<template>
  <div class="main-page">
    <h1>도구 목록</h1>
    <div class="button-container">
      <v-btn v-for="route in filteredRoutes" :key="route.path" class="nav-button" @click="navigateTo(route.path)">
        {{ route.comment }}
      </v-btn>
      <v-btn @click="getDeviceInfo()">정보조회</v-btn>
    </div>

    <v-dialog v-model="isInfoPopup" max-width="600px">
      <v-card>
        <v-card-title class="headline">미정산 금액</v-card-title>
        <v-card-text>
          <div v-if="info" class="mt-4 bg-gray-100 p-3 rounded">
            <span v-for="(line, index) in info" :key="index" class="block">
              {{ line }}<br/>
            </span>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="isInfoPopup = false">닫기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
</style>