<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLogger } from '../composables/useLogger';
import { database, ref as firebaseRef, get, update } from "../config/firebase";
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

useLogger();


const regularTask = ref({});
const taskList = ref({});
const isOpenPopup = ref(false);
const selectTask = ref("");
const date = ref("");
const place = ref("");
const cost = ref(0);

// AppBarTitle 컴포넌트에서 사용하는 아이콘
const { icon } = usePageMeta();
const defaultIcon = ref(icon.value);
const refreshIcon = ref('');

function setLoadingIcon() {
    refreshIcon.value = 'mdi-refresh';
}

function resetIcon() {
    refreshIcon.value = defaultIcon.value; // 복원
}


async function selectData() {
    setLoadingIcon();
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


    //console.log("* regularTask", regularTask.value);
    //console.log("* regularTask.task", regularTask.value.task);

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

    resetIcon();
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
    return diffDays
}

function getToday() {
    const today = new Date();

    const year = today.getFullYear();

    // 월은 0부터 시작하므로 1을 더함, padStart로 두 자리수 맞춤
    const month = String(today.getMonth() + 1).padStart(2, '0');

    // 일도 두 자리수 맞춤
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


function openPopup(param) {
    selectTask.value = param;
    place.value = taskList.value[param].place;
    cost.value = taskList.value[param].cost;
    date.value = getToday();
    isOpenPopup.value = true;
}

function getProgressTextColor(value) {
    // value: 퍼센트 (0~100)
    if (value <= 55) {
        return 'black'; // 어두운 배경에 흰 글씨
    } else {
        return 'white'; // 밝은 배경에 검정 글씨
    }
}
async function addAction() {
    const key = regularTask.value.task[selectTask.value].length;

    const data = {
        [key]: {
            "date": date.value.replaceAll('-', '')
        }
    }

    if (taskList.value[selectTask.value].place) {
        data[key].place = place.value;
    }

    if (taskList.value[selectTask.value].cost) {
        data[key].cost = Number(cost.value);
    }

    //console.log("save data", data);

    try {
        const dbRef = firebaseRef(database, "regular-task/task/" + selectTask.value);
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isOpenPopup.value = false;
    selectData();

}

function getProgressColor(value) {
    if (value <= 80) {
        return 'blue';
    } else {
        // 50~100 사이를 red 쪽으로 점점 변화시킴
        // 0: blue, 1: red
        const ratio = (value - 80) / 50;
        const red = Math.round(0 + (255 - 0) * ratio);
        const green = Math.round(0 + (0 - 0) * ratio);
        const blue = Math.round(255 - (255 - 0) * ratio);

        return `rgb(${red}, ${green}, ${blue})`;
    }
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
                <AppBarTitle :onIconClick="selectData" :refreshIcon="refreshIcon" />
            </v-app-bar>
            <div class="mt-4"></div>
            <v-container>
                <v-row v-for="(value, key) in taskList">
                    <v-col>
                        <h5 class="text-black mt-0 ml-2">{{ key }}</h5>
                        <v-sheet class="d-flex align-center mx-2 px-2 py-3" color="#f4f4f4" rounded="lg"
                            @click="openPopup(key)">

                            <v-progress-linear
                                :color="getProgressColor(value.diffDays / regularTask.duration[key] * 100)" height="14"
                                :max="regularTask.duration[key]" v-model="value.diffDays"
                                :style="{ color: getProgressTextColor(value.diffDays / regularTask.duration[key] * 100), fontSize: '11px' }"
                                rounded>
                                {{ value.diffDays }}
                            </v-progress-linear>
                            <div class="ms-4" style="font-size: 10px;">{{ regularTask.duration[key] }}</div>
                        </v-sheet>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>

        <v-dialog v-model="isOpenPopup" max-width="380px">
            <v-card>
                <v-card-title>{{ selectTask }}</v-card-title>
                <v-text-field label="날짜" v-model="date" type="date" />
                <v-text-field v-if="taskList[selectTask].place" v-model="place" label="장소" clearable />
                <v-text-field v-if="taskList[selectTask].cost" v-model="cost" label="금액" type="number" clearable />
                <v-card-actions>
                    <v-btn @click="addAction()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="isOpenPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-app>
</template>

<style scoped></style>
