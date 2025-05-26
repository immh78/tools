// src/router/index.js 또는 main.js
import { createRouter, createWebHashHistory } from 'vue-router';
import Main from '../pages/Main.vue'
import DuesList from '../pages/DuesList.vue';
import EnqQuizChapterAdj from '../pages/EngQuizChapterAdj.vue'
import TljSMS from '../pages/TljSMS.vue'

const routes = [
  { path: '/', component: Main, comment: '메인 페이지' },
  { path: '/dues-list', component: DuesList, comment: '우미린 가족여행 회비 목록' },
  { path: '/engquiz-adj', component: EnqQuizChapterAdj, comment: '영어 퀴즈 DB 오류 조정' },
  { path: '/tlj-sms', component: TljSMS, comment: '뚜레쥬르 선입금 문자발송' },
]

const router = createRouter({
  history: createWebHashHistory('/vite-project/'), // hash 모드 사용
  routes
})

export default router
