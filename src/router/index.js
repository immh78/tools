// src/router/index.js 또는 main.js
import { createRouter, createWebHashHistory } from 'vue-router';
import { database, ref as firebaseRef, get } from "../config/firebase";
import { isLoggedIn } from '../config/authGuard';
import { useUserStore } from '../store/user';

import Main from '../pages/Main.vue';
import DuesList from '../pages/DuesList.vue';
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


const routes = [
  {
    path: '/', component: Main, comment: '도구 모음', icon: 'mdi-tools',
    meta: { requiresAuth: true, restricted: true }
  },
  {
    path: '/dues-list', component: DuesList, comment: '우미린 가족여행 회비 목록', icon: 'mdi-umbrella-beach',
    meta: { requiresAuth: true, restricted: false }
  },
  {
    path: '/tlj-sms', component: TljSMS, comment: '뚜레쥬르 식권대장 예약', icon: 'mdi-cupcake',
    meta: { requiresAuth: true, restricted: true }
  },
  {
    path: '/log-view', component: LogView, comment: '로그 조회', icon: 'mdi-note-search-outline',
    meta: { requiresAuth: true, restricted: true }
  },
  {
    path: '/work-time', component: WorkTime, comment: '근무 시간', icon: 'mdi-clipboard-text-clock',
    meta: { requiresAuth: true, restricted: true }
  },
  {
    path: '/regular-task', component: RegularTask, comment: '정기적으로 할 일', icon: 'mdi-clipboard-check-outline',
    meta: { requiresAuth: true, restricted: true }
  },
  {
    path: '/car-book', component: CarBook, comment: '차계부', icon: 'mdi-car-wrench',
    meta: { requiresAuth: true, restricted: true }
  },
  {
    path: '/offering', component: Offering, comment: '헌금', icon: 'mdi-offer',
    meta: { requiresAuth: true, restricted: true }
  },
  {
    path: '/scoring', component: Scoring, comment: '채점', icon: 'mdi-note-edit-outline',
    meta: { requiresAuth: true, restricted: false }
  },
  {
    path: '/db-browser', component: DbBrowser, comment: 'DB 브라우저', icon: 'mdi-database-search',
    meta: { requiresAuth: true, restricted: true }
  },
  {
    path: '/test', component: Test, comment: '테스트', icon: 'mdi-flask',
    meta: { requiresAuth: false, restricted: false }
  },
  {
    path: '/login', component: Login, comment: '로그인', icon: 'mdi-login',
    meta: { requiresAuth: false, restricted: false }

  },
  {
    path: '/register', component: Register, comment: '회원등록', icon: 'mdi-account-plus',
    meta: { requiresAuth: false, restricted: false }
  },
  {
    path: '/access-denied', component: AccessDenied, comment: '권한없음', icon: 'mdi-cancel',
    meta: { requiresAuth: false, restricted: false }
  },
  ,
  {
    path: '/permission-editor', component: PermissionEditor, comment: '권한설정', icon: 'mdi-account-key',
    meta: { requiresAuth: true, restricted: true }
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

  // 로그인 필요
  if (to.meta.requiresAuth && !isLoggedIn()) {
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

export default router
