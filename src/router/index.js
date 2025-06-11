// src/router/index.js 또는 main.js
import { createRouter, createWebHashHistory } from 'vue-router';
import Main from '../pages/Main.vue';
import DuesList from '../pages/DuesList.vue';
//import EnqQuizChapterAdj from '../pages/EngQuizChapterAdj.vue';
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
import { isLoggedIn } from '../config/authGuard';

const routes = [
  {
    path: '/', component: Main, comment: '도구 모음', icon: 'mdi-tools',
    beforeEnter: (to, from, next) => {
      if (!isLoggedIn()) {
        next('/login');
      } else {
        next();
      }
    }
  },
  { path: '/dues-list', component: DuesList, comment: '우미린 가족여행 회비 목록', icon: 'mdi-umbrella-beach' },
  //{ path: '/engquiz-adj', component: EnqQuizChapterAdj, comment: '영어 퀴즈 DB 오류 조정' },
  { path: '/tlj-sms', component: TljSMS, comment: '뚜레쥬르 식권대장 예약', icon: 'mdi-cupcake' },
  {
    path: '/log-view', component: LogView, comment: '로그 조회', icon: 'mdi-note-search-outline',
    beforeEnter: (to, from, next) => {
      if (!isLoggedIn()) {
        next('/login');
      } else {
        next();
      }
    }
  },
  {
    path: '/work-time', component: WorkTime, comment: '근무 시간', icon: 'mdi-clipboard-text-clock',
    beforeEnter: (to, from, next) => {
      if (!isLoggedIn()) {
        next('/login');
      } else {
        next();
      }
    }
  },
  {
    path: '/regular-task', component: RegularTask, comment: '정기적으로 할 일', icon: 'mdi-clipboard-check-outline',
    beforeEnter: (to, from, next) => {
      if (!isLoggedIn()) {
        next('/login');
      } else {
        next();
      }
    }
  },
  {
    path: '/car-book', component: CarBook, comment: '차계부', icon: 'mdi-car-wrench',
    beforeEnter: (to, from, next) => {
      if (!isLoggedIn()) {
        next('/login');
      } else {
        next();
      }
    }
  },
  {
    path: '/offering', component: Offering, comment: '헌금', icon: 'mdi-offer',
    beforeEnter: (to, from, next) => {
      if (!isLoggedIn()) {
        next('/login');
      } else {
        next();
      }
    }
  },
  { path: '/scoring', component: Scoring, comment: '채점', icon: 'mdi-note-edit-outline' },
  { path: '/test', component: Test, comment: '테스트', icon: 'mdi-flask' },
  {
    path: '/login', component: Login, comment: '로그인', icon: 'mdi-login',
    beforeEnter: (to, from, next) => {
      if (isLoggedIn()) {
        next('/');
      } else {
        next();
      }
    }

  },
  { path: '/register', component: Register, comment: '회원등록', icon: 'mdi-account-plus' },
]

const router = createRouter({
  history: createWebHashHistory('/tools/'), // hash 모드 사용
  routes
})

export default router
