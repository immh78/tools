import { createApp } from 'vue'
//import './style.css'
import App from './App.vue'



// Vuetify 관련 import
import "vuetify/styles";
import { createVuetify } from 'vuetify';
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

// Vuetify 인스턴스 생성
const vuetify = createVuetify({
    components,
    directives,
})

createApp(App).use(vuetify).mount('#app');

