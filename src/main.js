import { createApp, watch } from 'vue'
//import './style.css'
import App from './App.vue'
import router from './router';



// Vuetify 관련 import
import { createVuetify } from 'vuetify';
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";
import '@mdi/font/css/materialdesignicons.css'; // MDI 아이콘 스타일 추가

// Vuetify 인스턴스 생성
const vuetify = createVuetify({
    components,
    directives,
})

router.isReady().then(() => {
    watch(
        () => router.currentRoute.value.path,
        (newPath) => {
            const manifest = document.querySelector('link[rel="manifest"]')
            if (!manifest) return

            if (newPath.startsWith('/car-book')) {
                manifest.href = '/vite-project/manifests/manifest-car-book.json?v=' + Date.now()
            } else if (newPath.includes('/dues-list')) {
                manifest.href = '/vite-project/manifests/manifest-dues-list.json?v=' + Date.now()
            } else {
                manifest.href = '/vite-project/manifests/manifest.json?v=' + Date.now()
            }
        },
        { immediate: true }
    )
})

createApp(App).use(vuetify).use(router).mount('#app');
