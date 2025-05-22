<template>
    <div>
      <button @click="sendSMS">SMS 보내기</button>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const phoneNumber = ref('01028541127')
  const message = ref('안녕하세요, 메시지입니다.\n감사합니다.')
  
  function sendSMS() {
    const smsLink = `sms:${phoneNumber.value}?body=${encodeURIComponent(message.value)}`
    window.location.href = smsLink
  }
  </script>
  