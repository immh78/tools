import { createApp, watch } from 'vue';
//import './style.css'
import App from './App.vue';
import router from './router';

// Vuetify 관련 import
import { createVuetify } from 'vuetify';
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";
import '@mdi/font/css/materialdesignicons.css'; // MDI 아이콘 스타일 추가
import { createPinia } from 'pinia';
import persistedState from 'pinia-plugin-persistedstate';
import * as labs from 'vuetify/labs/components'



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

createApp(App).use(vuetify).use(router).use(pinia).mount('#app');
