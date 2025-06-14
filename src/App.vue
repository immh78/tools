<script setup>
import { ref, onMounted } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database, ref as firebaseRef, get } from './config/firebase';
import { useUserStore } from './store/user';
import { RouterView } from 'vue-router';
import { useLogger } from './composables/useLogger';

const ready = ref(false);
const userStore = useUserStore();

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      userStore.setUser({
        email: user.email,
        name: await selectUserName(user.uid),
        uid: user.uid
      });   
    } else {
      userStore.clearUser();
    }
    ready.value = true;

    if (user) {
      useLogger(); // ✅ 로그인 확인 이후 logger 사용
    }
  });
});

async function selectUserName(uid) {
  const dbRef = firebaseRef(database, "user/" + uid);
  let userInfo = "";
  await get(dbRef)
    .then(snapshot => {
      if (snapshot.exists()) {
        userInfo = snapshot.val();
      }
    })
    .catch(err => {
      //console.error("Error fetching data:", err);
    });

  return userInfo.name;
}
</script>

<template>
  <div v-if="ready">
    <RouterView />
  </div>
  <div v-else>
    <v-container class="text-center">
      <v-progress-circular indeterminate color="primary" />
      <p>로그인 상태 확인 중...</p>
    </v-container>
  </div>
</template>

<style scoped></style>
