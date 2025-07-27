import { createApp, watch } from 'vue';
import App from './App.vue';
import router from './router';

//firebase
import { auth } from './config/firebase'; // Firebase 초기화
import { onAuthStateChanged } from 'firebase/auth';
import { useUserStore } from './store/user';

// Vuetify 관련 import
import { createVuetify } from 'vuetify';
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";
import '@mdi/font/css/materialdesignicons.css'; // MDI 아이콘 스타일 추가
import * as labs from 'vuetify/labs/components'

//pinia
import { createPinia } from 'pinia';
import persistedState from 'pinia-plugin-persistedstate';


// Vuetify 인스턴스 생성
const vuetify = createVuetify({
    components: {
        ...components, ...labs
    },
    directives,

})
const pinia = createPinia();
pinia.use(persistedState);


router.isReady().then(() => {
    watch(
        () => router.currentRoute.value.path,
        (newPath) => {
            const manifest = document.querySelector('link[rel="manifest"]')
            if (!manifest) return

            const tools = [
                'travel-logs',
                'car-book',
                'tlj-sms',
                'log-view',
                'work-time',
                'regular-task',
                'offering',
                'scoring',
                'tax',
                'test'
            ];

            manifest.href = "";

            for (const tool of tools) {
                if (newPath.includes(`/${tool}`)) {
                    manifest.href = `/tools/manifests/manifest-${tool}.json?v=` + Date.now();
                    break;
                }
            }

            if (manifest.href === "") {
                manifest.href = '/tools/manifests/manifest.json?v=' + Date.now();
            }

        },
        { immediate: true }
    )
})

const app = createApp(App);

app.use(pinia);
app.use(vuetify);
app.use(router);

onAuthStateChanged(auth, (user) => {
    //console.log("onAuthStateChanged", user);

    const userStore = useUserStore();
    if (user) {
        userStore.setUser({
            email: auth.currentUser.email,
            uid: auth.currentUser.uid
        }); // 로그인 정보 저장
    } else {
        userStore.clearUser();
    }   
    
});
app.mount('#app');


