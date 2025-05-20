// src/router/index.js 또는 main.js
import { createRouter, createWebHashHistory } from 'vue-router';
import DuesList from '../pages/DuesList.vue';
import EnqQuizChapterAdj from '../pages/EngQuizChapterAdj.vue'

const routes = [
  { path: '/', redirect: '/dues-list' },
  { path: '/dues-list', component: DuesList },
  { path: '/engquiz-adj', component: EnqQuizChapterAdj },
]

const router = createRouter({
  history: createWebHashHistory('/vite-project/'), // hash 모드 사용
  routes
})

export default router
