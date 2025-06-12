<template>
    <v-container class="fill-height d-flex justify-center align-center">
      <v-card class="pa-8 text-center">
        <v-icon size="64" color="error">mdi-lock-alert</v-icon>
        <h2 class="mt-4">Access Denied</h2>
        <p>You do not have permission to access this page.</p>
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
  