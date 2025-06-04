import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dotenv from 'dotenv';
import { VitePWA } from 'vite-plugin-pwa'

// 현재 NODE_ENV에 따라 올바른 .env 파일 로드
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });


export default defineConfig({
  plugins: [vue(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Default App',
      short_name: 'Default',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#42b983',
      icons: [
        {
          src: '/diy.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/diy.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
  }),

  ],
  base: '/vite-project/',
  define: {
    // Vite에서는 process.env 대신 import.meta.env 사용이 권장됩니다
    // 하지만 define을 통해 전역 상수로 정의도 가능합니다 (선택적)
    'process.env': process.env,
  },
});
