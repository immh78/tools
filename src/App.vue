<script setup>
  import { ref } from "vue";

  function sayHello() {
    alert("Good!!!");
  }
</script>

<template>
<v-app>
  <v-main>
    <v-container class="my-5">
      <v-btn color="primary" @click="sayHello">Test</v-btn>
    </v-container>
  </v-main>
</v-app>
  
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
