<script setup>
import { database, ref as firebaseRef, get, set } from "../config/firebase";
import { ref, onMounted } from 'vue';
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

/* ───────────────────────────────
 * state
 * ─────────────────────────────*/
const logTable   = ref({});   // page별 로그 원본
const userTable  = ref({});   // uid → user 정보
const tableData  = ref([]);   // 화면에 그릴 집계 결과
const error      = ref(null);
const adminUid   = ref('');

const headers = [
  { title: 'Page',  align: 'start',  key: 'page',   value: 'page'   },
  { title: 'User',  align: 'start',  key: 'user',   value: 'user'   },
  { title: 'Count', align: 'end',    key: 'count',  value: 'count'  },
  { title: 'Date',  align: 'center', key: 'latest', value: 'latest'}
];

/* AppBar 아이콘 처리 */
const { icon }  = usePageMeta();
const defaultIcon = ref(icon.value);
const refreshIcon = ref('');

function setLoadingIcon()  { refreshIcon.value = 'mdi-refresh'; }
function resetIcon()       { refreshIcon.value = defaultIcon.value; }

/* ───────────────────────────────
 * Firebase fetch helpers
 * ─────────────────────────────*/
async function getLogs() {
  const dbRef = firebaseRef(database, 'logs');
  try {
    const snap = await get(dbRef);
    logTable.value = snap.exists() ? snap.val() : {};
  } catch (err) {
    console.error('Error fetching logs:', err);
    error.value = err.message;
  }
}

async function getUser() {
  const dbRef = firebaseRef(database, 'user');
  try {
    const snap = await get(dbRef);
    userTable.value = snap.exists() ? snap.val() : {};
  } catch (err) {
    console.error('Error fetching users:', err);
    error.value = err.message;
  }
}

/* ───────────────────────────────
 * 데이터 가공
 * ─────────────────────────────*/
function processLogs(logs, users) {
  const entries = {};

  for (const page in logs) {
    // logs[page] = { pushId: {datetime, uid}, ... }
    Object.values(logs[page]).forEach(log => {
      const uid   = log.uid;
      const user  = users[uid] || {};
      const key   = `${page}_${user.name || uid}`;

      if (!entries[key]) {
        entries[key] = {
          page,
          user: user.name || uid,
          uid,
          count: 1,
          latest: log.datetime
        };
      } else {
        entries[key].count++;
        if (log.datetime > entries[key].latest) entries[key].latest = log.datetime;
      }
    });
  }

  const formatDate = dt => `${dt.slice(4,6)}/${dt.slice(6,8)} ${dt.slice(8,10)}:${dt.slice(10,12)}`;

  tableData.value = Object.values(entries).map(e => ({
    page:   e.page,
    user:   e.user,
    uid:    e.uid,
    count:  e.count,
    latest: formatDate(e.latest)
  }));
}

/* ───────────────────────────────
 * 메인 로딩 & 정리
 * ─────────────────────────────*/
async function dataLoading() {
  setLoadingIcon();
  await getLogs();
  await getUser();
  processLogs(logTable.value, userTable.value);
  adminUid.value = Object.entries(userTable.value).find(([k,u]) => u.name === '문명훈')?.[0] || '';
  resetIcon();
}

function clearLog() {
  const filtered = {};
  for (const page in logTable.value) {
    const kept = Object.fromEntries(
      Object.entries(logTable.value[page]).filter(([, log]) => log.uid !== adminUid.value)
    );
    if (Object.keys(kept).length) filtered[page] = kept;
  }
  set(firebaseRef(database,'logs'), filtered)
    .then(() => dataLoading())
    .catch(err => console.error('Error clearing logs:', err));
}

onMounted(() => { dataLoading(); });
</script>

<template>
  <v-app>
    <!-- AppBar -->
    <v-app-bar color="teal-darken-4">
      <template #image>
        <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)" />
      </template>
      <AppBarTitle :onIconClick="dataLoading" :refreshIcon="refreshIcon" />
      <template #append>
        <v-btn icon="mdi-broom" @click="clearLog" />
      </template>
    </v-app-bar>

    <!-- Main -->
    <v-main>
      <v-data-table
        :headers="headers"
        :items="tableData"
        class="elevation-1"
        no-data-text="조회중입니다."
        hide-default-footer
        items-per-page="-1"
        :show-items-per-page="false"
      >
        <template #item.user="{ item }">
          <span @click="item.user.endsWith('...') ? openUserInputPopup && openUserInputPopup(item.uid) : null">
            {{ item.user }}
          </span>
        </template>
      </v-data-table>
    </v-main>
  </v-app>
</template>

<style scoped>
/* 추가 스타일이 필요하면 여기에 작성 */
</style>
