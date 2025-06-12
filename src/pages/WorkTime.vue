<script setup>
import { database, ref as firebaseRef, get, update, set } from "../config/firebase";
import { ref, onMounted } from 'vue';
import { useLogger } from '../composables/useLogger';
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';
useLogger();

const workTimeInfo = ref({});
const start = ref(""); // 0830
const finish = ref(""); // 1721
const popupTime = ref(""); // 08:30
const isOver = ref(false);
const isOverPay = ref(false);
const isCalPopup = ref(false);
const overTimePay = ref(0);
const todayWorkTime = ref({}); // 금일 근무시간
const actTime = ref({}); // 누적 근무시간
const remainTime = ref({ hour: '-', minute: '-' }); // 잔여 근무시간
const isSnackbar = ref(false);
const lastRefreshTime = ref("");
const freeDays = ref([]);
const prePay= 16.5;

const base = ref(0); 
const prog = ref(0);
const calProg = ref(0);

const isPopup = ref(false);
const popupKind = ref("");

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


    base.value = workTimeInfo.value.planTime + prePay;
    start.value = workTimeInfo.value.start;
    finish.value = '';

    actTime.value = getHourMinute(workTimeInfo.value.actTime);

    // 달력에 의한 근무일수 계산
    const tempFreeDays = workTimeInfo.value.freeDays;

    freeDays.value = tempFreeDays.map(dateStr => {
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
        return date.toISOString();
    });
    //console.log("freeDays.value", tempFreeDays, freeDays.value);

    const workingDays = await getWorkingDaysInMonth(tempFreeDays);
    calProg.value = workingDays.untilTodayWorkdays * 8;


    //console.log("calProg.value", calProg.value);

    refreshCalcTime();
}

function getHourMinute(time) {
    const hour = Math.floor(time);
    const minute = Math.round((time - hour) * 60);
    return { hour, minute };
}

function getTime({ hour, minute }) {
    return Number(hour) + (Number(minute) / 60);
}

function refreshCalcTime() {
    setLoadingIcon();
    //console.log("refresh start", start.value);
    if (start.value === "") {
        todayWorkTime.value = { hour: 0, minute: 0 };
    } else {
        todayWorkTime.value = getHourMinute(calctodayWorkTime());
    }

    if (todayWorkTime.value.hour >= 9) {
        todayWorkTime.value.hour -= 1;
    } else if (todayWorkTime.value.hour >= 4 && todayWorkTime.value.minute >= 30) {
        todayWorkTime.value = getHourMinute(getTime(todayWorkTime.value) - 0.5);
    }

    // workTimeInfo.value.actTime = 162;
    prog.value = workTimeInfo.value.actTime + getTime(todayWorkTime.value);
    //console.log(prog.value);

    //console.log("prog", prog.value, "base", base.value, "act", workTimeInfo.value.actTime)

    if (prog.value > workTimeInfo.value.planTime + prePay) {
        isOver.value = true;
        base.value = prog.value;
        prog.value = workTimeInfo.value.planTime;

        //console.log("over", workTimeInfo.value.actTime + todayWorkTime.value - workTimeInfo.value.planTime - 16.5);

        if (workTimeInfo.value.actTime + getTime(todayWorkTime.value) - workTimeInfo.value.planTime > prePay) {
            isOverPay.value = true;
            overTimePay.value = Math.round(workTimeInfo.value.salary / 240 * 1.5 * (workTimeInfo.value.actTime + getTime(todayWorkTime.value) - workTimeInfo.value.planTime - prePay)).toLocaleString();
        }
    }

    remainTime.value = getHourMinute(workTimeInfo.value.planTime - workTimeInfo.value.actTime - getTime(todayWorkTime.value));
    //console.log("remainTime", remainTime.value);

    const d = getNow();
    lastRefreshTime.value = d.slice(0, 2) + ":" + d.slice(2);
    resetIcon();
}

function calctodayWorkTime() {
    const now = finish.value === '' ? getNow() : finish.value;

    // 문자열을 시(hour)와 분(minute)으로 분해
    const startHour = parseInt(start.value.slice(0, 2), 10);
    const startMinute = parseInt(start.value.slice(2), 10);

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

async function saveTodayWorkTime() {
    finish.value = popupTime.value.slice(0, 2) + popupTime.value.slice(3); // 0830

    refreshCalcTime(); //todayWorkTime 갱신

    const time = workTimeInfo.value.actTime + getTime(todayWorkTime.value);
    const data = { "actTime": Number(time), "start": "" };

    finish.value = ''; // 퇴근시간 초기화

    saveData(data);
    getWorkTimeInfo();
    isPopup.value = false;

}

async function saveWorkInfo() {
    const data = { "actTime": Number(getTime(actTime.value)), "planTime": Number(workTimeInfo.value.planTime) };
    saveData(data);
    getWorkTimeInfo();
}

function saveStartTime() {
    if (workTimeInfo.value.start === "") {
        const now = getNow();
        const data = { "start": now };

        saveData(data);
        getWorkTimeInfo();
    } else {
        //console.log("start", workTimeInfo.value.start);
        popupTime.value = workTimeInfo.value.start.slice(0, 2) + ":" + workTimeInfo.value.start.slice(2);
        popupKind.value = "START";
        isPopup.value = true;
    }
}

function openFinishTimePopup() {
    popupKind.value = "FINISH";
    popupTime.value = getNow().slice(0, 2) + ":" + getNow().slice(2);
    isPopup.value = true;
}

function saveStartTimeSelect() {
    const data = { "start": popupTime.value.slice(0, 2) + popupTime.value.slice(3) };
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

async function getWorkingDaysInMonth(freeDays = []) {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based
    const todayDay = today.getDate();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    const apiKey = 'TJA71zif4CfRseoCQiA085iUVt%2BzzJGBzyyRB76Tc6aTqpCwyVqhB1AZwXaPg7NIx0Su8MNPf%2BtN%2BoadNkd6Gg%3D%3D';
    const apiUrl = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?solYear=${year}&solMonth=${String(month + 1).padStart(2, '0')}&ServiceKey=${apiKey}&_type=json`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    // 공공 API 휴일 목록
    const holidays = new Set();
    if (data.response.body.items?.item) {
        const items = Array.isArray(data.response.body.items.item)
            ? data.response.body.items.item
            : [data.response.body.items.item];
        for (const item of items) {
            holidays.add(item.locdate.toString()); // 예: '20250606'
        }
    }

    // 사용자 지정 휴일 추가
    for (const day of freeDays) {
        holidays.add(day);
    }

    let fullMonthWorkdays = 0;
    let untilTodayWorkdays = 0;

    for (let day = 1; day <= lastDayOfMonth; day++) {
        const date = new Date(year, month, day);
        const weekday = date.getDay(); // 0=일요일, ..., 6=토요일
        const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;

        if (weekday >= 1 && weekday <= 5 && !holidays.has(dateStr)) {
            fullMonthWorkdays++;
            if (day <= todayDay) {
                untilTodayWorkdays++;
            }
        }
    }

    return {
        fullMonthWorkdays,
        untilTodayWorkdays
    };
}
async function saveFreeDays() {
    console.log(freeDays.value)
    const formattedDates = freeDays.value.map(iso => {
        const date = new Date(iso);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0'); // month: 0-based
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}${mm}${dd}`;
    });

    try {
        const dbRef = firebaseRef(database, "work-time/freeDays");
        await set(dbRef, formattedDates); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    getWorkTimeInfo();
    isCalPopup.value = false;
    
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
                <v-btn icon="mdi-cog" @click="isCalPopup = true"></v-btn>
            </template>
            <AppBarTitle :onIconClick="refreshCalcTime" :refreshIcon="refreshIcon" />
        </v-app-bar>
        <v-main>
            <span class="mt-2 mr-2"
                style="display: flex; font-size:11px; justify-content: end; align-items: center;"><v-icon
                    size="12px">mdi-clock-outline</v-icon> {{ lastRefreshTime }}</span>
            <v-card class="mt-2 ml-2 mr-2" variant="flat">
                <v-progress-linear 
                    :model-value="workTimeInfo.actTime" 
                    color= "blue"
                    :buffer-value="prog"
                    buffer-color="blue-lighten-3"
                    buffer-opacity="1"
                    :max="base"
                    :bg-color="isOver ? isOverPay ? 'red-darken-1' : 'yellow-darken-3' : 'grey'"
                    bg-opaccity="1"
                    height="8">
                </v-progress-linear>
                <v-progress-linear 
                    :model-value="calProg" 
                    color= "grey"
                    :buffer-value="calProg + prePay"
                    buffer-color="grey-lighten-2"
                    buffer-opacity="1"
                    :max="base"
                    bg-color="grey"
                    bg-opaccity="1"
                    height="2" >
                </v-progress-linear>
            </v-card>

            <v-card class="mt-2 ml-2 mr-2" variant="flat">
                <v-row>
                    <v-col cols="12">
                        <v-text-field :label="'의무 근무시간 | 잔여 근무시간 :' + remainTime.hour + '시간 ' + remainTime.minute + '분'"
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
                        <v-text-field :label="`금일 근무시간 (${workTimeInfo.start?.slice(0, 2) + ':' + workTimeInfo.start?.slice(2)})`" v-model="todayWorkTime.hour"
                            :style="{ color: workTimeInfo.start === '' ? 'white' : 'black' }" variant="outlined"
                            type="number" readonly></v-text-field> </v-col>
                    <v-col cols="6">
                        <v-text-field label="분" v-model="todayWorkTime.minute"
                            :style="{ color: workTimeInfo.start === '' ? 'white' : 'black' }" variant="outlined"
                            type="number" readonly></v-text-field> </v-col>
                </v-row>
            </v-card>
            <div class="mt-4" style="display: flex; justify-content: center; align-items: center;">
                <v-btn class="ma-2" @click="saveStartTime()"><v-icon>mdi-home-import-outline</v-icon> 출근</v-btn>
                <v-btn class="ma-2" @click="openFinishTimePopup()"
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
            <v-card :title="popupKind === 'START' ? '출입시간' : '퇴근시간'">

                <v-text-field class="ma-2" v-model="popupTime" type="time" variant="outlined"></v-text-field>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="취소" @click="isPopup = false"></v-btn>
                    <v-btn text="저장"
                        @click="popupKind === 'START' ? saveStartTimeSelect() : saveTodayWorkTime()"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="isCalPopup" max-width="500">
            <v-vard title="연차휴가일 선택">
                <v-date-picker v-model="freeDays" color='red-lighten-3' multiple></v-date-picker>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="취소" @click="isCalPopup = false"></v-btn>
                    <v-btn text="저장" @click="saveFreeDays()"></v-btn>
                </v-card-actions>
            </v-vard>
        </v-dialog>
    </v-app>

    <v-snackbar v-model="isSnackbar">저장 완료!</v-snackbar>
</template>

<style scoped></style>
