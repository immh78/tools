// src/router/index.js 또는 main.js
import { createRouter, createWebHashHistory } from 'vue-router';
import Main from '../pages/Main.vue';
import DuesList from '../pages/DuesList.vue';
import EnqQuizChapterAdj from '../pages/EngQuizChapterAdj.vue';
//import TljSMS from '../pages/TljSMS.vue';
import TljResv from '../pages/TljResv.vue';
import LogView from '../pages/LogView.vue';
import WorkTime from '../pages/WorkTime.vue';
import Test from '../pages/Test.vue';

const routes = [
  { path: '/', component: Main, comment: '메인 페이지' },
  { path: '/dues-list', component: DuesList, comment: '우미린 가족여행 회비 목록' },
  { path: '/engquiz-adj', component: EnqQuizChapterAdj, comment: '영어 퀴즈 DB 오류 조정' },
  { path: '/tlj-sms', component: TljResv, comment: '뚜레쥬르 선입금 문자발송' },
  { path: '/tlj-resv', component: TljResv, comment: '뚜레쥬르 식권대장 예약' },
  { path: '/log-view', component: LogView, comment: '로그 조회' },
  { path: '/work-time', component: WorkTime, comment: '근무 시간' },
  { path: '/test', component: Test, comment: '테스트' },  
]

const router = createRouter({
  history: createWebHashHistory('/vite-project/'), // hash 모드 사용
  routes
})

export default router
