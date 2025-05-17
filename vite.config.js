import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dotenv from 'dotenv';
//import { VitePWA } from 'vite-plugin-pwa'

// 현재 NODE_ENV에 따라 올바른 .env 파일 로드
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export default defineConfig({
  plugins: [
    vue()
    // VitePWA({
    //   registerType: 'autoUpdate', // service worker가 변경되면 자동으로 업데이트
    //   includeAssets: ['book_6.svg', 'book_6.png'], // 정적 파일
    //   manifest: {
    //     name: '채원이 영단어 암기',
    //     short_name: 'cwEngWord',
    //     description: '채원이 영단어 암기용 앱',
    //     theme_color: '#42b883',
    //     background_color: '#ffffff',
    //     display: 'standalone',
        //scope: '/vite-project/',        
        //start_url: '/vite-project/#/eng-quiz',
        // icons: [
        //   {
        //     src: 'book_6.png',
        //     sizes: '192x192',
        //     type: 'image/png'
        //   },
        //   {
        //     src: 'book_6.png',
        //     sizes: '512x512',
        //     type: 'image/png'
        //   },
        //   {
        //     src: 'book_6.png',
        //     sizes: '512x512',
        //     type: 'image/png',
        //     purpose: 'any maskable'
        //   }
        // ]
    //   }
    // })
  ],
  base: '/vite-project/', 
  define: {
    // Vite에서는 process.env 대신 import.meta.env 사용이 권장됩니다
    // 하지만 define을 통해 전역 상수로 정의도 가능합니다 (선택적)
    'process.env': process.env,
  },
});
