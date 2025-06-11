<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useLogger } from '../composables/useLogger';
import { AppBarTitle } from '../composables/getRouteInfo';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useUserStore } from '../store/user';

useLogger();

const visitorId = ref('');
const router = useRouter();
const cookies = useCookies();
const userStore = useUserStore();

// 라우트 배열에서 메인 페이지(`/`)를 제외한 라우트만 필터링
const filteredRoutes = router.options.routes.filter(route => route.path !== '/');

function navigateTo(path) {
  router.push(path);
}

async function logout() {
  await signOut(auth);
  cookies.remove('authToken');
  userStore.clearUser();
  router.push('/login');
};

onMounted(async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();

  visitorId.value = result.visitorId;
});
</script>

<template>
  <v-app>
    <v-app-bar color="teal-darken-4">
      <template v-slot:image>
        <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
      </template>
      <template v-slot:append>
        <v-btn icon="mdi-logout" @click="logout()"></v-btn>
      </template>      
      <AppBarTitle />
    </v-app-bar>

    <v-main>
      <div class="main-page">
        <v-container>
          <v-row>
            <v-col v-for="routeItem in filteredRoutes" :key="routeItem.path" cols="6" sm="3"
              class="d-flex justify-center">
              <div class="icon-item" @click="navigateTo(routeItem.path)">
                <v-icon size="36">{{ routeItem.icon }}</v-icon>
                <small>{{ routeItem.comment }}</small>
              </div>
            </v-col>

            <!-- Firebase 버튼 -->
            <v-col cols="6" sm="3" class="d-flex justify-center">
              <div class="icon-item">
                <v-btn icon
                  :href="'https://console.firebase.google.com/u/0/project/my-firebase-9450e/database/my-firebase-9450e-default-rtdb/data'"
                  target="_blank" variant="flat">
                  <v-icon>mdi-fire</v-icon>
                </v-btn>
                <small>Firebase</small>
              </div>
            </v-col>

            <!-- GitHub 버튼 -->
            <v-col cols="6" sm="3" class="d-flex justify-center">
              <div class="icon-item">
                <v-btn icon :href="'https://github.com/immh78/tools'" target="_blank" variant="flat">
                  <v-icon>mdi-github</v-icon>
                </v-btn>
                <small>GitHub</small>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </v-main>
    <div class="visitor-id-overlay">
      <span>{{ visitorId }}</span>
    </div>
  </v-app>
</template>

<style scoped>
.main-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.icon-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* 두 열로 설정 */
  gap: 30px;
  justify-items: center;
  margin-top: 30px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* 아이콘과 텍스트 수직 정렬 */
  cursor: pointer;
  width: 100%;
  /* 너비를 100%로 설정하여 부모의 너비에 맞추기 */
  text-align: center;
  max-width: 120px;
  /* 최대 너비를 설정해 균등한 열 배치를 보장 */
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
</style>
