// src/router/index.js 또는 main.js
import { createRouter, createWebHashHistory } from 'vue-router';
import Main from '../pages/Main.vue'
import DuesList from '../pages/DuesList.vue';
import EnqQuizChapterAdj from '../pages/EngQuizChapterAdj.vue'
import TljSMS from '../pages/TljSMS.vue'

const routes = [
  { path: '/', component: Main },
  { path: '/dues-list', component: DuesList },
  { path: '/engquiz-adj', component: EnqQuizChapterAdj },
  { path: '/tlj-sms', component: TljSMS },
]

const router = createRouter({
  history: createWebHashHistory('/vite-project/'), // hash 모드 사용
  routes
})

export default router
