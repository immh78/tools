<template>
    <v-container class="fill-height d-flex justify-center align-center">
      <v-card class="pa-8 text-center">
        <v-icon size="64" color="error">mdi-lock-alert</v-icon>
        <h2 class="mt-4">Access Denied</h2>
        <p>화면 조회 권한이 없습니다. 문명훈님에게 요청하시기 바랍니다.</p>
        <!-- <v-btn color="primary" @click="$router.push('/')">Go to Home</v-btn> -->
      </v-card>
    </v-container>
  </template>
  
  <script setup>
  // 스크립트 필요시 여기에
  </script>
  
  <style scoped>
  h2 {
    font-weight: bold;
  }
  </style>
  