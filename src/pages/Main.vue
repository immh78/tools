<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { database, ref as firebaseRef, get, update } from "../config/firebase";
import { useLogger } from '../composables/useLogger';
import { AppBarTitle } from '../composables/getRouteInfo';

useLogger();

const visitorId = ref('');
const router = useRouter();
const visitorTable = ref([]);
const visitorName = ref('');
const isUserInputPopup = ref(false);

// 라우트 배열에서 메인 페이지(`/`)를 제외한 라우트만 필터링
const filteredRoutes = router.options.routes.filter(route => route.path !== '/');

function navigateTo(path) {
  router.push(path);
}


async function getVisitors() {
  const dbRef = firebaseRef(database, "visitors");
  await get(dbRef)
    .then(snapshot => {
      if (snapshot.exists()) {
        visitorTable.value = snapshot.val();
        //console.log("Fetched logs:", logs.value);
      } else {
        console.log("No data available");
      }
    })
    .catch(err => {
      console.error("Error fetching data:", err);
    });
}

async function inputVisitorInfo() {
  const host = visitorName.value === '문명훈' ? true : false;
  const data = {
    [visitorId.value]:
    {
      "name": visitorName.value,
      "isHost": host
    }
  }

  try {
    const dbRef = firebaseRef(database, "visitors");
    await update(dbRef, data); // 데이터를 저장
  } catch (err) {
    console.error("Error saving data:", err);
  }

  isUserInputPopup.value = false;
}


// visitorId가 허용된 ID인지 여부 판단
const isAllowed = ref(false);

onMounted(async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  await getVisitors();
  visitorId.value = result.visitorId;

  if (visitorTable.value[visitorId.value]) {
    isAllowed.value = visitorTable.value[visitorId.value].isHost;
  }
});
</script>

<template>
  <v-app>
    <v-app-bar color="teal-darken-4">
      <template v-slot:image>
        <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
      </template>
      <AppBarTitle />
    </v-app-bar>
    <v-main>
      <template v-if="isAllowed">
        <div class="main-page">
          <v-container>
            <v-row>
              <v-col v-for="route in filteredRoutes" :key="route.path" cols="6" sm="3" class="d-flex justify-center">
                <div class="icon-item" @click="navigateTo(route.path)">
                  <v-icon size="36">{{ route.icon }}</v-icon>
                  <small>{{ route.comment }}</small>
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
                  <v-btn icon :href="'https://github.com/immh78/vite-project'" target="_blank" variant="flat">
                    <v-icon>mdi-github</v-icon>
                  </v-btn>
                  <small>GitHub</small>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </template>

      <!-- 권한 없을 경우 -->
      <div v-else class="d-flex align-center justify-center fill-height">
        <h2>{{ visitorTable[visitorId] ? visitorTable[visitorId].name + '님 안녕하세요.' : '' }}</h2>
      </div>
    </v-main>
    <v-dialog v-model="isUserInputPopup" max-width="600px">
      <v-card>
        <v-card-title>사용자명 등록</v-card-title>
        <v-card-text>
          <v-text-field :label="visitorId" v-model="visitorName" autofocus clearable />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="inputVisitorInfo()" icon="mdi-check-bold"></v-btn>
          <v-btn @click="isUserInputPopup = false" icon="mdi-close-thick"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div class="visitor-id-overlay">
      <span @click="isUserInputPopup = visitorTable[visitorId] ? false : true">{{ visitorTable[visitorId] ?
        visitorTable[visitorId].name : visitorId }}</span>
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
