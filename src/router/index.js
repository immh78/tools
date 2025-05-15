import { createRouter, createWebHashHistory } from 'vue-router';
import EngQuiz from '../pages/EngQuiz.vue';
import Login from '../pages/Login.vue';
import DuesList from '../pages/DuesList.vue';

const routes = [
  { path: '/quiz', component: EngQuiz }, 
  { path: '/', component: EngQuiz }, 
  { path: '/login', component: Login },
  { path: '/dues', component: DuesList },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;