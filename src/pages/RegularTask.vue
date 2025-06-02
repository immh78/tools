<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLogger } from '../composables/useLogger';
import { database, ref as firebaseRef, get, update, remove } from "../config/firebase";

//useLogger();


const regularTask = ref({});
const taskList = ref({});
const isOpenPopup = ref(false);
const selectTask = ref("");

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
    console.log("* regularTask.task", regularTask.value.task);

    const result = {}

    for (const [key, entries] of Object.entries(regularTask.value.task)) {
        if (!entries || entries.length === 0) continue;

        const latest = entries.reduce((latest, current) => {
            const latestDate = Number(latest.date);
            const currentDate = Number(current.date);
            return currentDate > latestDate ? current : latest;
        });

        latest["diffDays"] = daysBetweenToday(latest["date"]);
        result[key] = latest;
    }

    // 2단계: duration 값 기준으로 key 정렬
    const sortedKeys = Object.entries(regularTask.value.duration)
        .sort((a, b) => a[1] - b[1])  // value 기준 정렬
        .map(([key]) => key);         // key만 추출

    // 3단계: 정렬된 순서대로 taskList 구성
    taskList.value = {};
    for (const key of sortedKeys) {
        if (result[key]) {
            taskList.value[key] = result[key];
        }
    }

    console.log("taskList", taskList.value);
}

function daysBetweenToday(dateString) {
    //console.log("dateString", dateString)

    const today = new Date()
    const targetDate = new Date(
        parseInt(dateString.slice(0, 4)),
        parseInt(dateString.slice(4, 6)) - 1,
        parseInt(dateString.slice(6, 8))
    )

    // 밀리초 단위 차이 → 일수
    const diffTime = today - targetDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
}

function openPopup(param) {
    selectTask.value = param;
    isOpenPopup.value = true;
}

onMounted(async () => {
    selectData();
});
</script>

<template>
    <v-app>
        <v-main>
            <v-app-bar color="teal-darken-4">
                <template v-slot:image>
                    <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
                </template>
                <v-app-bar-title><v-icon>mdi-clipboard-check-outline</v-icon> 정기적으로 할일</v-app-bar-title>
            </v-app-bar>
            <v-row v-for="(value, key) in taskList">
                <v-col>
                    <h3 class="text-black mt-1 ml-2">{{ key }}</h3>
                    <v-sheet class="d-flex align-center mx-2 px-4 py-8" color="#f4f4f4" rounded="lg"
                        @click="openPopup(key)">

                        <v-progress-linear :location="null" color="primary" height="20" :max="regularTask.duration[key]"
                            v-model="value.diffDays" rounded>{{ value.diffDays }}</v-progress-linear>
                        <div class="ms-4">{{ regularTask.duration[key] }}</div>
                    </v-sheet>
                </v-col>
            </v-row>
        </v-main>

        <v-dialog v-model="isOpenPopup" max-width="380px">
            <v-card>
                <v-card-title>{{ selectTask }}</v-card-title>
                <v-text-field v-if="taskList[selectTask].place" label="장소" autofocus clearable />
                <v-text-field v-if="taskList[selectTask].cost" label="금액" type="number" clearable />
                <v-card-actions>
                    <v-btn @click="action()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="isOpenPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-app>
</template>

<style scoped></style>
