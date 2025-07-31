<script setup>
import { database, ref as firebaseRef, get, update, set } from "../config/firebase";
import { ref, onMounted } from 'vue';
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

const workTimeInfo = ref({});
const start = ref(""); // 0830
const finish = ref(""); // 1721
const popupTime = ref(""); // 08:30
const isOver = ref(false);
const isOverPay = ref(false);
const isCalPopup = ref(false);
const overTimePay = ref(0);
const overTimePayList = ref([]);
const todayWorkTime = ref({}); // 금일 근무시간
const actTime = ref({}); // 누적 근무시간
const remainTime = ref({ hour: '-', minute: '-' }); // 잔여 근무시간
const isSnackbar = ref(false);
const lastRefreshTime = ref("");
const freeDays = ref([]);
const prePay = 16.5;
const commonWorkTime = ref(0);
const remainWorkTime = ref(0);
const isForcastOverPay = ref(true);
const forcastOverTimePay = ref(0);
const forcastOverTime = ref(0);
const isSaveOverPayPopup = ref(false);
const overPay = ref({
    month: "",
    overTimePay: 0
});

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

    console.log("overtimepay", Object.entries(workTimeInfo.value.overTimePay));

    
    Object.entries(workTimeInfo.value.overTimePay).sort((a, b) => {return b[0].localeCompare(a[0])}).map(([ym, value]) => {
        const year = ym.slice(0, 4);
        const month = String(parseInt(ym.slice(4), 10)); // "06" -> 6
        overTimePayList.value.push({
            month: `${year}년 ${month}월`,
            amount: value.toLocaleString() // "160000" -> "160,000"
        });
    });

    console.log("overTimePayList", overTimePayList.value)
    


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
    commonWorkTime.value = workingDays.commonWorkTime;
    remainWorkTime.value = workingDays.remainingWorkHours;


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

    //console.log("todayWorkTime", todayWorkTime.value.hour, todayWorkTime.value.minute)
    //console.log("getNow", getNow().slice(0, 2));

    if (Number(getNow().slice(0, 2)) >= 13) {
        todayWorkTime.value.hour -= 1;
    } else if ((todayWorkTime.value.hour === 4 && todayWorkTime.value.minute >= 30) || todayWorkTime.value.hour > 4) {
        //console.log("30분 차감!")
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

    let addWorkTime = 0;
    if (getTime(todayWorkTime.value) > commonWorkTime.value) {
        addWorkTime = getTime(todayWorkTime.value) - commonWorkTime.value;
    }

    const forcastOverTimeCalc = workTimeInfo.value.actTime + remainWorkTime.value + addWorkTime - workTimeInfo.value.planTime - prePay;

    if (forcastOverTimeCalc > 0) {
        isForcastOverPay.value = true;

        forcastOverTime.value = forcastOverTimeCalc;
        forcastOverTimePay.value = Math.round(workTimeInfo.value.salary / 240 * 1.5 * forcastOverTimeCalc).toLocaleString();
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

function openStartTimePopup() {
    if (workTimeInfo.value.start === "") {
        workTimeInfo.value.start = getNow();
    }

    popupTime.value = workTimeInfo.value.start.slice(0, 2) + ":" + workTimeInfo.value.start.slice(2);
    popupKind.value = "START";
    isPopup.value = true;
}

function openFinishTimePopup() {
    popupKind.value = "FINISH";
    popupTime.value = getNow().slice(0, 2) + ":" + getNow().slice(2);
    isPopup.value = true;
}
function getMonth() {
    const today = new Date();

    const y = today.getFullYear();

    // 월은 0부터 시작하므로 1을 더함, padStart로 두 자리수 맞춤
    const month = String(today.getMonth()).padStart(2, '0');

    // 일도 두 자리수 맞춤
    //const day = String(today.getDate()).padStart(2, '0');

    return `${y}${month}`;
}

function onclick_saveOverPay() {
    overPay.value.month = getMonth();
    overPay.value.overTimePay = overTimePay.value ? Number(overTimePay.value.replace(/,/g, '')) : 0; // 쉼표 제거 후 숫자로 변환
    isSaveOverPayPopup.value = true;
}

async function saveOverTimePay() {
    const data = {
        [overPay.value.month]: Number(overPay.value.overTimePay)
    }

    try {
        const dbRef = firebaseRef(database, "work-time/overTimePay");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isSaveOverPayPopup.value = false;
    isSnackbar.value = true;
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
    const weekday = today.getDay(); // 0=일, ..., 6=토
    const lastDay = new Date(year, month + 1, 0).getDate();

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

    // ── 2. 오늘의 근무 시간 판단 ──
    const todayStr = `${year}${String(month + 1).padStart(2, '0')}${String(todayDay).padStart(2, '0')}`;

    let commonWorkTime = 0;
    if (!holidays.has(todayStr)) {
        if (weekday >= 1 && weekday <= 4)        // 월(1)~목(4)
            commonWorkTime = 9.5;
        else if (weekday === 5)                  // 금(5)
            commonWorkTime = 5;
        // 토(6), 일(0)은 그대로 0
    }

    /* ── 4. 오늘 이후 근무 시간 합계 (규칙 적용) ── */
    let remainingWorkHours = 0;                        // ★


    for (let d = todayDay; d <= lastDay; d++) {    // ★ 내일~말일
        const date = new Date(year, month, d);
        const weekday = date.getDay();                  // 0=일,6=토
        const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`;

        // 평일 + 휴일 아님
        if (weekday >= 1 && weekday <= 5 && !holidays.has(dateStr)) {
            // 기본 시간
            let hours = weekday === 5 ? 5 : 9.5;           // 금=5, 월~목=9.5

            // 내일이 휴일이면 5.5로 대체
            const nextDate = new Date(year, month, d + 1);
            const nextDateStr =
                `${nextDate.getFullYear()}${String(nextDate.getMonth() + 1).padStart(2, '0')}` +
                `${String(nextDate.getDate()).padStart(2, '0')}`;

            if (holidays.has(nextDateStr)) hours = 5.5;    // ★ 대체 규칙

            remainingWorkHours += hours;                   // ★ 합산
        }
    }

    return {
        fullMonthWorkdays,
        untilTodayWorkdays,
        commonWorkTime,
        remainingWorkHours
    };
}
async function saveFreeDays() {
    //console.log(freeDays.value)
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
                <v-btn icon="mdi-calendar-month" @click="isCalPopup = true"></v-btn>
                <v-btn icon="mdi-content-save" @click="saveWorkInfo()"></v-btn>
            </template>
            <AppBarTitle :onIconClick="refreshCalcTime" :refreshIcon="refreshIcon" />
        </v-app-bar>
        <v-main>
            <span class="mt-2 mr-2"
                style="display: flex; font-size:11px; justify-content: end; align-items: center;"><v-icon
                    size="12px">mdi-clock-outline</v-icon> {{ lastRefreshTime }}</span>
            <v-card class="mt-2 ml-2 mr-2" variant="flat">
                <v-progress-linear :model-value="workTimeInfo.actTime" color="blue" :buffer-value="prog"
                    buffer-color="blue-lighten-3" buffer-opacity="1" :max="base"
                    :bg-color="isOver ? isOverPay ? 'red-darken-1' : 'yellow-darken-3' : 'grey'" bg-opaccity="1"
                    height="8">
                </v-progress-linear>
                <v-progress-linear v-if="workTimeInfo.start !== ''" :model-value="workTimeInfo.actTime"
                    color="light-green" :buffer-value="workTimeInfo.actTime + commonWorkTime"
                    buffer-color="light-green-lighten-3" buffer-opacity="1" :max="base" bg-color="grey" bg-opaccity="1"
                    height="4">
                </v-progress-linear>
                <v-progress-linear :model-value="calProg" color="grey" :buffer-value="calProg + prePay"
                    buffer-color="grey-lighten-2" buffer-opacity="1" :max="base" bg-color="grey" bg-opaccity="1"
                    height="4">
                </v-progress-linear>
            </v-card>

            <v-card class="mt-2 ml-2 mr-2" variant="flat">
                <v-row>
                    <v-col cols="12">
                        <v-text-field
                            :label="'의무 근무시간 | 잔여 근무시간 : ' + remainTime.hour + '시간 ' + remainTime.minute + '분'"
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
            </v-card>
            <v-row class="ma-2">
                <v-col cols="10">
                    <v-card class="ma-2" v-if="isOverPay || isForcastOverPay" variant="flat" color="indigo-darken-3"
                        style="align-items: center; justify-content: center; width: auto; padding: 10px;">
                        <div class="text-h7" style="text-align: center;">
                            예상 : {{ forcastOverTimePay }}원 ({{ Math.round(forcastOverTime * 10) / 10 }}시간) <span
                                style="color:grey;">|</span> {{ overTimePay }}원
                        </div>
                    </v-card>
                </v-col>
                <v-col cols="2" class="d-flex align-center justify-end">
                    <v-btn variant="text" @click="onclick_saveOverPay()"><v-icon
                            color="indigo-darken-3">mdi-arrow-down-bold</v-icon></v-btn>
                </v-col>
            </v-row>

            <v-timeline>
                <v-timeline-item v-for="(item, index) in overTimePayList" :key="index" dot-color="green"
                    icon="mdi-cash">
                    <template #opposite>
                        <strong>{{ item.month }}</strong>
                    </template>
                    <div>
                        {{ item.amount }} 원
                    </div>
                </v-timeline-item>
            </v-timeline>

            <v-snackbar v-model="isSnackbar" :timeout="2000" color="primary" variant="tonal">
                저장 완료!
            </v-snackbar>
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
        <v-dialog v-model="isCalPopup" max-width="320">
            <v-card>
                <v-date-picker title="연차휴가일 선택" v-model="freeDays" color="red-lighten-3" multiple></v-date-picker>
                <v-card-actions class="justify-center">
                    <v-btn text @click="isCalPopup = false">닫기</v-btn>
                    <v-btn text @click="saveFreeDays()">저장</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="isSaveOverPayPopup" max-width="320">
            <v-card class="pa-4">
                <v-card-title>초과근무수당 등록</v-card-title>
                <v-text-field label="월" v-model="overPay.month" type="text" variant="outlined"></v-text-field>
                <v-text-field label="초과근무수당" v-model="overPay.overTimePay" type="number"
                    variant="outlined"></v-text-field>
                <v-card-actions class="justify-center">
                    <v-btn text @click="isSaveOverPayPopup = false">닫기</v-btn>
                    <v-btn text @click="saveOverTimePay()">저장</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>


</template>

<style scoped>
</style>
