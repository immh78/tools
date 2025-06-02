<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLogger } from '../composables/useLogger';
import { database, ref as firebaseRef, get, update, remove } from "../config/firebase";

//useLogger();


const regularTask = ref({});
const taskList = [];

async function selectData() {
    const dbRef = firebaseRef(database, "regular-task");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                regularTask.value = snapshot.val();
            }
        })
        .catch(err => {
            //console.error("Error fetching data:", err);
        });


    console.log("* regularTask", regularTask.value);

    taskList.value = Object.entries(regularTask.value.duration)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);

    console.log("* taskList", taskList.value);


}

onMounted(async () => {
    selectData();
});
</script>

<template>
    <v-app>
        <v-main>
            <v-app-bar color="teal-darken-4"> <!--image="https://picsum.photos/1920/1080?random-->
                <template v-slot:image>
                    <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
                </template>
                <template v-slot:append>
                    <v-btn icon="mdi-send" @click="shareTableAsImage()"></v-btn>
                </template>
                <v-app-bar-title><v-icon>mdi-cupcake</v-icon> 뚜레쥬르 식권대장 예약</v-app-bar-title>
            </v-app-bar>
        </v-main>

    </v-app>
</template>

<style scoped></style>
