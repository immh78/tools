import { createRouter, createWebHistory } from 'vue-router';
import EngQuiz from '../pages/EngQuiz.vue';
import Login from '../pages/Login.vue';
import DuesList from '../pages/DuesList.vue';

const routes = [
  { path: '/vite-project/quiz', component: EngQuiz }, 
  { path: '/vite-project/', component: EngQuiz }, 
  { path: '/vite-project/login', component: Login },
  { path: '/vite-project/dues', component: DuesList },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;