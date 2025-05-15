// src/router/index.js 또는 main.js
import { createRouter, createWebHashHistory } from 'vue-router'
import EngQuiz from '../pages/EngQuiz.vue'
import DuesList from '../pages/DuesList.vue'

const routes = [
  { path: '/', redirect: '/eng-quiz' },
  { path: '/eng-quiz', component: EngQuiz },
  { path: '/dues-list', component: DuesList }
]

const router = createRouter({
  history: createWebHashHistory('/vite-project/'), // hash 모드 사용
  routes
})

export default router
