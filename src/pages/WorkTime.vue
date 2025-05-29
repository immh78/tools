<script setup>
import { database, ref as firebaseRef, get, update } from "../config/firebase";
import { ref, onMounted } from 'vue';
//import { useLogger } from '../composables/useLogger';
//useLogger();

const workTimeInfo = ref({});
const start = ref("");
const isOver = ref(false);
const isOverPay = ref(false);
const overTimePay = ref(0);
const todayWorkTime = ref(0);

const base = ref(0);
const prog = ref(0);

async function getWorkTimeInfo() {
    const dbRef = firebaseRef(database, "work-time");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                workTimeInfo.value = snapshot.val();
            }
        })
        .catch(err => {
            console.error("Error fetching data:", err);
        });


    base.value = workTimeInfo.value.planTime;

    start.value = workTimeInfo.value.start;
    todayWorkTime.value = calctodayWorkTime(start.value);

    if (todayWorkTime.value > 8) {
        todayWorkTime.value -= 1;
    } else if (todayWorkTime.value > 4) {
        todayWorkTime.value -= 0.5;
    }

    // workTimeInfo.value.actTime = 162;
    prog.value = workTimeInfo.value.actTime + todayWorkTime.value;
    console.log(workTimeInfo.value.actTime + todayWorkTime.value);

    if (workTimeInfo.value.actTime + todayWorkTime.value > workTimeInfo.value.planTime) {
        isOver.value = true;
        base.value = workTimeInfo.value.actTime + todayWorkTime.value;
        prog.value = workTimeInfo.value.planTime;

        if (workTimeInfo.value.actTime + todayWorkTime.value - workTimeInfo.value.planTime > 16.5) {
            isOverPay.value = true;
            overTimePay.value = workTimeInfo.value.salary / 240 * 1.5 * (workTimeInfo.value.actTime + todayWorkTime.value - workTimeInfo.value.planTime - 16.5);
        }
    }

}

function calctodayWorkTime(pStart) {
    const now = getNow();

    // 문자열을 시(hour)와 분(minute)으로 분해
    const startHour = parseInt(pStart.slice(0, 2), 10);
    const startMinute = parseInt(pStart.slice(2), 10);

    const nowHour = parseInt(now.slice(0, 2), 10);
    const nowMinute = parseInt(now.slice(2), 10);

    // 총 분으로 환산
    const startTotalMinutes = startHour * 60 + startMinute;
    const nowTotalMinutes = nowHour * 60 + nowMinute;

    // 분 차이를 시간 단위로 계산 (소수점 포함)
    const diffInMinutes = nowTotalMinutes - startTotalMinutes;
    const diffInHours = diffInMinutes / 60;

    return diffInHours.toFixed(2);
}

function getNow() {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    return String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
}

async function saveTodayWorkTime() {

    const time = workTimeInfo.value.actTime + todayWorkTime.value;

    const data = {"actTime":time,"start":""};

    try {
        const dbRef = firebaseRef(database, "work-time");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    getWorkTimeInfo();
}

async function saveWorkInfo() {
    const data = {"actTime":workTimeInfo.value.actTime,"planTime":workTimeInfo.value.planTime};

    try {
        const dbRef = firebaseRef(database, "work-time");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    getWorkTimeInfo();
}

function openStartPopup() {
    if (workTimeInfo.value.start === "") {
        saveStart
    } 
}

async function saveStart() {
    const data = {"start":""};
}

onMounted(async () => {
    getWorkTimeInfo();
});
</script>

<template>
    <v-app>
        <v-app-bar color="teal-darken-4">
            <template v-slot:image>
                <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
            </template>
            <template v-slot:append>
                <v-btn icon="mdi-content-save" @click="saveWorkInfo()"></v-btn>
            </template>
            <v-app-bar-title><v-icon>mdi-clipboard-text-clock</v-icon> 근무 시간 계산기</v-app-bar-title>
        </v-app-bar>
        <v-main>
            <v-card class="mt-2 ml-2 mr-2" variant="flat">
                <v-progress-linear v-model="prog" color="blue"
                    :bg-color="isOver ? isOverPay ? 'red-darken-1' : 'yellow-darken-3' : 'blue-lighten-5'"
                    bg-opacity="1" height="14" rounded :max="base">
                </v-progress-linear>
            </v-card>

            <v-card class="mt-2 ml-2 mr-2" variant="flat">
                <v-text-field label="의무 근무시간" v-model="workTimeInfo.planTime" variant="outlined"
                    class="mt-2"></v-text-field>
                <v-text-field label="누적 근무시간" v-model="workTimeInfo.actTime" variant="outlined"></v-text-field>
                <v-text-field v-if="workTimeInfo.start" label="금일 근무시간" v-model="todayWorkTime" variant="outlined"></v-text-field>
                <h3 v-if="isOverPay">{{ overTimePay }}</h3>
            </v-card>
            <v-btn @click="saveStart()">출근</v-btn><v-btn @click="saveTodayWorkTime()">퇴근</v-btn>
        </v-main>
    </v-app>
</template>

<style scoped></style>