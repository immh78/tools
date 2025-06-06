<script setup>
import { database, ref as firebaseRef, get, update } from "../config/firebase";
import { ref, onMounted } from 'vue';
import { useLogger } from '../composables/useLogger';
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';
useLogger();

const workTimeInfo = ref({});
const start = ref("");
const isOver = ref(false);
const isOverPay = ref(false);
const overTimePay = ref(0);
const todayWorkTime = ref({});
const actTime = ref({});
const remainTime = ref({hour:'-', minute:'-'});
const isSnackbar = ref(false);
const startTime = ref("");
const lastRefreshTime = ref("");

const base = ref(0);
const prog = ref(0);

const isPopup = ref(false);

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


async function getWorkTimeInfo() {
    isOver.value = false;
    isOverPay.value = false;

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

    actTime.value = getHourMinute(workTimeInfo.value.actTime);

    refreshCalcTime();
}

function getHourMinute(time) {
    const hour = Math.floor(time);
    const minute = Math.round((time - hour) * 60);
    return { hour, minute };
}

function getTime({hour, minute}) {
    return Number(hour) + (Number(minute) / 60);
}

function refreshCalcTime() {
    setLoadingIcon();
    if (start.value === "") {
        todayWorkTime.value = { hour: 0, minute: 0 };
    } else {
       todayWorkTime.value = getHourMinute(calctodayWorkTime(start.value));
    }

    
    if (todayWorkTime.value.hour >= 9) {
        todayWorkTime.value.hour -= 1;
    } else if (todayWorkTime.value.hour >= 4 && todayWorkTime.value.minute >= 30) {
        todayWorkTime.value = getHourMinute(getTime(todayWorkTime.value) - 0.5);
    }

    //console.log("todayWorkTime", todayWorkTime.value);

    // workTimeInfo.value.actTime = 162;
    prog.value = workTimeInfo.value.actTime + getTime(todayWorkTime.value);
    //console.log(prog.value);

    if (prog.value > workTimeInfo.value.planTime) {
        isOver.value = true;
        base.value = prog.value;
        prog.value = workTimeInfo.value.planTime;

        //console.log("over", workTimeInfo.value.actTime + todayWorkTime.value - workTimeInfo.value.planTime - 16.5);

        if (workTimeInfo.value.actTime + getTime(todayWorkTime.value) - workTimeInfo.value.planTime > 16.5) {
            isOverPay.value = true;
            overTimePay.value = Math.round(workTimeInfo.value.salary / 240 * 1.5 * (workTimeInfo.value.actTime + getTime(todayWorkTime.value) - workTimeInfo.value.planTime - 16.5)).toLocaleString();
        }
    }

    remainTime.value = getHourMinute(workTimeInfo.value.planTime - workTimeInfo.value.actTime - getTime(todayWorkTime.value));
    //console.log("remainTime", remainTime.value);

    const d = getNow();;
    lastRefreshTime.value = d.slice(0, 2) + ":" + d.slice(2);
    resetIcon();
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

    return diffInHours;
}

function getNow() {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    return String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
}

async function savetodayWorkTime() {
    const time = workTimeInfo.value.actTime + getTime(todayWorkTime.value);
    const data = { "actTime": Number(time), "start": "" };

    saveData(data)
    getWorkTimeInfo();
}

async function saveWorkInfo() {
    const data = { "actTime": Number(getTime(actTime.value)), "planTime": Number(workTimeInfo.value.planTime) };
    saveData(data);
    getWorkTimeInfo();
}

function openStartPopup() {
    if (workTimeInfo.value.start === "") {
        const now = getNow();
        const data = { "start": now };

        saveData(data);
        getWorkTimeInfo();
    } else {
        //console.log("start", workTimeInfo.value.start);
        startTime.value = workTimeInfo.value.start.slice(0, 2) + ":" + workTimeInfo.value.start.slice(2);
        isPopup.value = true;
    }
}

function saveStart() {
    const data = { "start": startTime.value.slice(0, 2) + startTime.value.slice(3) };
    isPopup.value = false;

    saveData(data);
    getWorkTimeInfo();
}

async function saveData(data) {
    try {
        const dbRef = firebaseRef(database, "work-time");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isSnackbar.value = true;
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
            <AppBarTitle :onIconClick="refreshCalcTime" :refreshIcon="refreshIcon" />
        </v-app-bar>
        <v-main>
            <span class="mt-2" style="display: flex; font-size:11px; justify-content: end; align-items: center;"><v-icon size="12px">mdi-clock-outline</v-icon> {{ lastRefreshTime }}</span>
            <v-card class="mt-2 ml-2 mr-2" variant="flat">
                <v-progress-linear v-model="prog" color="blue"
                    :bg-color="isOver ? isOverPay ? 'red-darken-1' : 'yellow-darken-3' : 'blue-lighten-5'"
                    bg-opacity="1" height="4" rounded :max="base">
                </v-progress-linear>
            </v-card>

            <v-card class="mt-2 ml-2 mr-2" variant="flat">
                <v-row>
                    <v-col cols="12">
                        <v-text-field
                            :label="'의무 근무시간 | 잔여 근무시간 :' + remainTime.hour + '시간 ' + remainTime.minute + '분'"
                            v-model="workTimeInfo.planTime" variant="outlined" type="number" class="mt-2" />
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="6">
                        <v-text-field label="누적 근무시간" v-model="actTime.hour" type="number" variant="outlined" />
                    </v-col>
                    <v-col cols="6">
                        <v-text-field label="분" v-model="actTime.minute" type="number" variant="outlined" />
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="6">
                        <v-text-field label="금일 근무시간" v-model="todayWorkTime.hour"
                            :style="{ color: workTimeInfo.start === '' ? 'white' : 'black' }" variant="outlined" type="number"
                            readonly></v-text-field> </v-col>
                    <v-col cols="6">
                        <v-text-field label="분" v-model="todayWorkTime.minute"
                            :style="{ color: workTimeInfo.start === '' ? 'white' : 'black' }" variant="outlined" type="number"
                            readonly></v-text-field> </v-col>
                </v-row>


            </v-card>
            <div class="mt-4" style="display: flex; justify-content: center; align-items: center;">
                <v-btn class="ma-2" @click="openStartPopup()"><v-icon>mdi-home-import-outline</v-icon> 출근</v-btn>
                <v-btn class="ma-2" @click="savetodayWorkTime()"
                    :disabled="workTimeInfo.start === ''"><v-icon>mdi-home-export-outline</v-icon> 퇴근</v-btn>                    
            </div>
            <v-card class="ma-2" v-if="isOverPay" variant="flat" color="indigo-darken-3"
                style="position: fixed; bottom: 20px; right: 20px; display: flex; align-items: center; justify-content: center; width: auto; padding: 10px;">
                <div class="text-h7" style="text-align: center;">
                    {{ overTimePay }}원
                </div>
            </v-card>
        </v-main>

        <v-dialog v-model="isPopup" max-width="500">
            <v-card title="출입시간">

                <v-text-field class="ma-2" v-model="startTime" type="time" variant="outlined"></v-text-field>

                <v-card-actions>
                    <v-spacer></v-spacer>

                    <v-btn text="취소" @click="isPopup = false"></v-btn>
                    <v-btn text="저장" @click="saveStart()"></v-btn>
                </v-card-actions>
            </v-card>

        </v-dialog>
    </v-app>

    <v-snackbar v-model="isSnackbar">저장 완료!</v-snackbar>
</template>

<style scoped></style>
