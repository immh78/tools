// src/router/index.js 또는 main.js
import { createRouter, createWebHashHistory } from 'vue-router';
import { database, ref as firebaseRef, get, push } from "../config/firebase";
import { useUserStore } from '../store/user';

import Main from '../pages/Main.vue';
//import DuesList from '../pages/DuesList.vue';
import TravelLogs from '../pages/TravelLogs.vue';
import TljSMS from '../pages/TljSMS.vue';
import LogView from '../pages/LogView.vue';
import WorkTime from '../pages/WorkTime.vue';
import RegularTask from '../pages/RegularTask.vue';
import CarBook from '../pages/CarBook.vue';
import Test from '../pages/Test.vue';
import Offering from '../pages/Offering.vue';
import Scoring from '../pages/Scoring.vue';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';
import AccessDenied from '../pages/AccessDenied.vue';
import PermissionEditor from '../pages/PermissionEditor.vue';
import DbBrowser from '../pages/DbBrowser.vue';
import Tax from '../pages/Tax.vue';

const routes = [
  {
    path: '/', component: Main, comment: '도구 모음', icon: 'mdi-tools',
    meta: { requiresAuth: true, restricted: true, loggable: true }
  },
  {
    path: '/travel-logs', component: TravelLogs, comment: '우미린 가족여행 기록', icon: 'mdi-umbrella-beach',
    meta: { requiresAuth: true, restricted: false, loggable: true }
  },
  {
    path: '/tlj-sms', component: TljSMS, comment: '뚜레쥬르 식권대장 예약', icon: 'mdi-cupcake',
    meta: { requiresAuth: true, restricted: true, loggable: true }
  },
  {
    path: '/log-view', component: LogView, comment: '로그 조회', icon: 'mdi-note-search-outline',
    meta: { requiresAuth: true, restricted: true, loggable: true }
  },
  {
    path: '/work-time', component: WorkTime, comment: '근무 시간', icon: 'mdi-clipboard-text-clock',
    meta: { requiresAuth: true, restricted: true, loggable: true }
  },
  {
    path: '/regular-task', component: RegularTask, comment: '정기적으로 할 일', icon: 'mdi-clipboard-check-outline',
    meta: { requiresAuth: true, restricted: true, loggable: true }
  },
  {
    path: '/car-book', component: CarBook, comment: '차계부', icon: 'mdi-car-wrench',
    meta: { requiresAuth: true, restricted: true, loggable: true }
  },
  {
    path: '/offering', component: Offering, comment: '헌금', icon: 'mdi-offer',
    meta: { requiresAuth: true, restricted: true, loggable: true }
  },
  {
    path: '/scoring', component: Scoring, comment: '채점', icon: 'mdi-note-edit-outline',
    meta: { requiresAuth: true, restricted: false, loggable: true }
  },
  {
    path: '/db-browser', component: DbBrowser, comment: 'DB 브라우저', icon: 'mdi-database-search',
    meta: { requiresAuth: true, restricted: true, loggable: true }
  },
  {
    path: '/db-browser', component: Tax, comment: '세금 납부 이력', icon: 'mdi-payments',
    meta: { requiresAuth: true, restricted: true, loggable: true }
  },
  {
    path: '/test', component: Test, comment: '테스트', icon: 'mdi-flask',
    meta: { requiresAuth: false, restricted: false, loggable: true }
  },
  {
    path: '/login', component: Login, comment: '로그인', icon: 'mdi-login',
    meta: { requiresAuth: false, restricted: false, loggable: false }

  },
  {
    path: '/register', component: Register, comment: '회원등록', icon: 'mdi-account-plus',
    meta: { requiresAuth: false, restricted: false, loggable: false }
  },
  {
    path: '/access-denied', component: AccessDenied, comment: '권한없음', icon: 'mdi-cancel',
    meta: { requiresAuth: false, restricted: false, loggable: false }
  },
  ,
  {
    path: '/permission-editor', component: PermissionEditor, comment: '권한설정', icon: 'mdi-account-key',
    meta: { requiresAuth: true, restricted: true, loggable: true }
  }
]

async function checkPermission(path, uid) {

  if (path === '/') path = '/root';

  const dbRef = firebaseRef(database, "permission/tools" + path);
  //console.log('check permission', "permission/tools" + path, uid)

  try {
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const allowedUsers = snapshot.val();
      //console.log('allowedUsers', allowedUsers)
      return allowedUsers.includes(uid);
    }
    return false;
  } catch (err) {
    console.error("Permission check error:", err);
    return false;
  }
}

const router = createRouter({
  history: createWebHashHistory('/tools/'), // hash 모드 사용
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const uid = userStore.user?.uid;
  //console.log("router.beforeEach", uid);

  // 로그인 필요
  if (to.meta.requiresAuth && !uid) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  // 권한 필요
  if (to.meta.restricted && uid) {
    //console.log("to.path", to.path);
    const isPermitted = await checkPermission(to.path, uid);
    if (!isPermitted) {
      return next('/access-denied');
    }
  }

  next(); // 통과
});

/* 1) 공통 날짜·시간 포매터 (Asia/Seoul, YYYYMMDDhhmmss)          */
function formatKST() {
  const kst = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  );
  return (
    kst.getFullYear() +
    String(kst.getMonth() + 1).padStart(2, '0') +
    String(kst.getDate()).padStart(2, '0') +
    String(kst.getHours()).padStart(2, '0') +
    String(kst.getMinutes()).padStart(2, '0') +
    String(kst.getSeconds()).padStart(2, '0')
  );
}

/* 2) afterEach 훅에서 호출될 실제 로깅 함수                       */
async function logPageVisit(route) {
  // (1) 로그 기록이 필요 없는 화면이면 종료
  if (route.meta?.loggable === false) return;

  // (2) 페이지 ID: '/' → root, 그 외엔 마지막 path 세그먼트
  const pageId =
    route.path === '/'
      ? 'root'
      : route.path.replace(/^\/|\/$/g, '').split('/').pop();

  // (3) 접속 사용자 UID(없으면 anonymous)
  const userStore = useUserStore();
  const uid = userStore.user?.uid || 'anonymous';

  // (4) 로그 객체
  const logEntry = {
    datetime: formatKST(),   // YYYYMMDDhhmmss
    uid                     // 사용자 UID
  };

  // (5) Firebase Realtime DB: logs/{pageId}/auto-key
  try {
    const logsRef = firebaseRef(database, `logs/${pageId}`);
    await push(logsRef, logEntry);     // push() → 자동 고유 키 생성
  } catch (err) {
    console.error('Error saving log:', err);
  }
}

router.afterEach((to) => {
  const userStore = useUserStore();
  const uid = userStore.user?.uid;

  //console.log("router.afterEach", uid);
  // meta.loggable === true인 페이지만 기록
  if (to.meta?.loggable && uid) {
    // '/'는 실질적으로 대시보드 같은 첫 화면이므로 필요하면 별도 처리
    //console.log("router.afterEach #2");
    logPageVisit(to);    
  }
});

export default router
