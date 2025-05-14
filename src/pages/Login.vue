<template>
    <div>
      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="login">로그인</button>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { signInWithEmailAndPassword, auth } from '../config/firebase';
  import { useRouter } from 'vue-router';
  
  const email = ref('');
  const password = ref('');
  const router = useRouter();
  
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.value, password.value);
      router.push('/');
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  };
  </script>
  