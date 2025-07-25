<script setup>
import { ref, onMounted, watch } from 'vue'
import { database, ref as firebaseRef, get, set, remove, update } from "../config/firebase";
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

const carBook = ref({});
const tab = ref("SORENTO");
const mileageSORENTO = ref(0);
const mileageSM6 = ref(0);
const forecateDateSORENTO = ref("");
const forecateDateSM6 = ref("");
const forecateDate = ref("");
const mileage = ref(0);
const mileageText = ref('');
const lastChangeOilSORENTO = ref(0);
const lastChangeOilSM6 = ref(0);
const oilMileage = ref(0);
const oilChangeMileage = 15000;
const listSORENTO = ref([]);
const listSM6 = ref([]);
const list = ref([]);
const fuelAmount = ref(0);

const isPopup = ref(false);
const isPopupKind = ref("");
const isFuelPopup = ref(false); // 가스 등록 팝업
const comboList = ['기름', '엔진오일', '주행거리'];
const addData = ref({});

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

const headers = [
    { title: '날짜', align: 'start', key: 'date', value: 'date', width: 140 },
    { title: '항목', align: 'start', key: 'category', value: 'category', nowrap: true },
    { title: '주행거리', align: 'end', key: 'mileage', value: 'mileage', width: 120 },
];
const currentPage = ref(1);

/* 유틸: 숫자 → 쉼표포맷 문자열 */
const toComma = n =>
    n === null || n === '' ? '' : Number(n).toLocaleString()

/* 유틸: 문자열 → 숫자 (쉼표 제거) */
const toNumber = str => {
    const digits = str.replace(/,/g, '')
    return digits === '' ? null : Number(digits)
}

/* 입력 변화 감시 → 실제 숫자 업데이트 */
watch(mileageText, val => {
    const num = toNumber(val)
    if (!Number.isNaN(num)) mileage.value = num
})

/* 실제 숫자 변화 감시 → 포맷 문자열 업데이트
   (백엔드에서 값 받아왔을 때도 포맷 유지) */
watch(mileage, val => {
    mileageText.value = toComma(val)
})

async function selectData() {
    setLoadingIcon();
    const dbRef = firebaseRef(database, "car-book");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                carBook.value = snapshot.val();
            }
        })
        .catch(err => {
            //console.error("Error fetching data:", err);
        });

    //console.log("* carBook", carBook.value);

    listSORENTO.value = sortData(carBook.value.SORENTO);
    listSM6.value = sortData(carBook.value.SM6);

    //console.log("listSORENTO", listSORENTO.value);
    //console.log("listSM6", listSM6.value);

    let { forecateMileage, avgPerDay } = calcEstimatedMileage(listSORENTO.value);

    mileageSORENTO.value = forecateMileage;
    const avgPerDaySORENTO = avgPerDay;

    ({ forecateMileage, avgPerDay } = calcEstimatedMileage(listSM6.value));

    mileageSM6.value = forecateMileage;
    const avgPerDaySM6 = avgPerDay;

    //console.log("mileageSORENTO", mileageSORENTO.value);
    //console.log("mileageSM6", mileageSM6.value);

    lastChangeOilSORENTO.value = getLastChangeOilMileage(listSORENTO.value);
    lastChangeOilSM6.value = getLastChangeOilMileage(listSM6.value);

    forecateDateSORENTO.value = getForecateDate(mileageSORENTO.value, lastChangeOilSORENTO.value, avgPerDaySORENTO);
    forecateDateSM6.value = getForecateDate(mileageSM6.value, lastChangeOilSM6.value, avgPerDaySM6);

    //console.log("lastChangeOilSORENTO", lastChangeOilSORENTO.value);
    //console.log("lastChangeOilSM6", lastChangeOilSM6.value);
    resetIcon();
}

function getForecateDate(mileage, lastChangeOil, avgPerDay) {
    const today = new Date().setHours(0, 0, 0, 0);
    const date = new Date(today + (((oilChangeMileage - (mileage - lastChangeOil)) / avgPerDay) * 1000 * 60 * 60 * 24));
    //console.log("마지막 오일 교체후 거리", mileage - lastChangeOil)
    //console.log("오일교체까지 남은 거리", oilChangeMileage - (mileage - lastChangeOil))
    //console.log("남은거리/ 하루평균 주행거리", (oilChangeMileage - (mileage - lastChangeOil)) / avgPerDay)
    //console.log("오늘 + 남은일수", today + (((oilChangeMileage - (mileage - lastChangeOil)) / avgPerDay) * 1000 * 60 * 60 * 24));
    // "2025. 7. 12" 형식으로 출력

    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

function parseDate(dateStr) {
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    return new Date(year, month, day);
}

function sortData(data) {
    let tempData = [];

    // 중간에 누락된 index가 있을경우 오류 방지
    Object.keys(data).forEach(key => {
        //console.log("key", key);
        tempData.push({ ...data[key], 'key': Number(key) });
    })
    //정렬
    return [...tempData].sort((a, b) => b.mileage - a.mileage);
}

function threeMonthsAgo(yyyymmdd) {
    // 1. 문자열 → Date
    const y = +yyyymmdd.slice(0, 4);
    const m = +yyyymmdd.slice(4, 6) - 1; // JS는 0-based month
    const d = +yyyymmdd.slice(6, 8);
    const date = new Date(Date.UTC(y, m, d));   // UTC로 만들어두면 타임존 문제↓ 최소화

    // 2. 3개월 차감 (내장 메서드가 월 길이/윤년 자동 보정)
    date.setUTCMonth(date.getUTCMonth() - 3);

    // 3. 다시 YYYYMMDD 포맷
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

function calcEstimatedMileage(data) {
    // 마지막 두 항목을 날짜 순으로 정렬 후 가져오기
    const sortedData = data;
    const latest = sortedData[0];
    let previous = {};

    //console.log("latest.date", latest.date);

    for (let i = 1; i < sortedData.length; i++) {
        if (threeMonthsAgo(latest.date) > sortedData[i].date) {
            previous = sortedData[i];
            break;
        }
    }

    //console.log("parseDate", previous.date, latest.date)
    const date1 = parseDate(previous.date)
    const date2 = parseDate(latest.date)

    const mileage1 = previous.mileage
    const mileage2 = latest.mileage

    const daysDiff = (date2 - date1) / (1000 * 60 * 60 * 24)
    const mileageDiff = mileage2 - mileage1

    const avgPerDay = mileageDiff / daysDiff;

    const today = new Date().setHours(0, 0, 0, 0);

    //console.log("today", today, "date2", date2, "diff", (today - date2)/ (1000 * 60 * 60 * 24));
    const daysSinceLast = (today - date2) / (1000 * 60 * 60 * 24)

    const forecateMileage = mileage2 + Math.round(avgPerDay * daysSinceLast);
    // 오늘까지 예상 주행거리 = 최종 주행거리 + (평균 일일 주행거리 * 오늘까지 지난 일수)

    return { forecateMileage, avgPerDay };
}

function getLastChangeOilMileage(data) {
    //console.log("filter data", data.filter(item => item.category === '엔진오일'))

    const latest = (data.filter(item => item.category === '엔진오일').reduce((latest, current) => {
        const latestDate = Number(latest.date);
        const currentDate = Number(current.date);
        return currentDate > latestDate ? current : latest;
    }));

    return latest.mileage;
}

watch(() => tab.value, (newTab) => {
    changeTab(newTab);
});

function changeTab(newTab) {
    currentPage.value = 1; // 페이지 초기화

    if (newTab === "SORENTO") {
        mileage.value = mileageSORENTO.value;
        oilMileage.value = mileageSORENTO.value - lastChangeOilSORENTO.value;
        forecateDate.value = forecateDateSORENTO.value;
        list.value = listSORENTO.value;

    } else {
        mileage.value = mileageSM6.value;
        oilMileage.value = mileageSM6.value - lastChangeOilSM6.value;
        forecateDate.value = forecateDateSM6.value;
        list.value = listSM6.value;
    }

    //console.log("forecateDate", forecateDate.value);
}

watch(() => addData.value.category, (newVal) => {
    if (isPopupKind.value === 'ADD') {
        let findedItem = {};

        if (tab.value === 'SORENTO') {
            findedItem = listSORENTO.value.find(item => item.category === newVal);

        } else {
            findedItem = listSM6.value.find(item => item.category === newVal);
        }

        addData.value.remark = findedItem ? findedItem.remark : '';
        addData.value.cost = findedItem ? findedItem.cost : '';
    }
});

function getProgressTextColor(value) {
    // value: 퍼센트 (0~100)
    if (value <= 55) {
        return 'black'; // 어두운 배경에 흰 글씨
    } else {
        return 'white'; // 밝은 배경에 검정 글씨
    }
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

function getToday() {
    const today = new Date();

    const year = today.getFullYear();

    // 월은 0부터 시작하므로 1을 더함, padStart로 두 자리수 맞춤
    const month = String(today.getMonth() + 1).padStart(2, '0');

    // 일도 두 자리수 맞춤
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function openAddPopup() {
    addData.value = {
        "date": getToday(),
        "mileage": mileage.value,
        "category": '',
        "cost": 0,
        "remark": '',
        "key": -1
    }
    isPopupKind.value = "ADD";
    isPopup.value = true;
}

function openDetailPopup(item) {
    //console.log("openDetailPopup", item);
    addData.value = {
        "date": item.date.slice(0, 4) + '-' + item.date.slice(4, 6) + '-' + item.date.slice(6, 8),
        "category": item.category,
        "mileage": item.mileage,
        "cost": item.cost,
        "liter": item.liter,
        "remark": item.remark,
        "key": item.key
    }
    //console.log("addData.value", addData.value);

    isPopupKind.value = "VIEW";
    isPopup.value = true;
}

function openFuelPopup() {
    addData.value = {
        "date": getToday(),
        "mileage": mileage.value,
        "category": '기름',
        "cost": 0,
        "remark": '',
        "liter": 0
    }

    fuelAmount.value = carBook.value.fuel.unitCost * carBook.value.fuel.liter;
    isFuelPopup.value = true;
}

function calcFuelAmount(type) {
    if (type === 'COST' || type === 'LITER') {
        fuelAmount.value = Math.round(carBook.value.fuel.unitCost * carBook.value.fuel.liter);
    } else if (type === 'AMOUNT') {
        carBook.value.fuel.liter = Math.round(fuelAmount.value / carBook.value.fuel.unitCost);
    }
}

async function addFuel() {
    addData.value.key = -1;
    addData.value.cost = fuelAmount.value;
    addData.value.liter = carBook.value.fuel.liter;
    isFuelPopup.value = false;

    try {
        const dbRef = firebaseRef(database, "car-book/fuel");
        await set(dbRef, carBook.value.fuel); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    addAction();
}

async function deleteData() {
    try {
        const dbRef = firebaseRef(database, `car-book/${tab.value}/${addData.value.key}`);
        await remove(dbRef); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isPopup.value = false;
    await selectData();
    changeTab(tab.value);
}

async function addAction() {
    const key = addData.value.key === -1 ? getNewKey() : addData.value.key;
    const value = {
        "date": addData.value.date.replaceAll('-', ''),
        "cost": addData.value.cost ? Number(addData.value.cost) : -1,
        "category": addData.value.category || "주행거리",
        "remark": addData.value.remark || "",
        "liter": addData.value.liter || 0,
        "mileage": Number(addData.value.mileage)
    }

    const data = {
        [key]: value
    }

    //console.log("save data", tab.value, data);

    try {
        const dbRef = firebaseRef(database, "car-book/" + tab.value);
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isPopup.value = false;
    await selectData();
    changeTab(tab.value);
}

function getNewKey() {
    console.log("list.value", list.value);
    let key = 0;
    if (list.value) {
        const keys = list.value.map(item => item.key);
        // 0부터 순차적으로 증가하며 비어있는 값을 찾기
        while (keys.includes(key)) {
            key++;
        }
    } else {
        key = 0;
    }

    return key;
}

function onRowClick(_, ctx) {
    openDetailPopup(ctx.item)
}

onMounted(async () => {
    await selectData();
    changeTab(tab.value);

});
</script>

<template>
    <v-app>
        <v-app-bar color="teal-darken-4">
            <template v-slot:image>
                <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
            </template>
            <template v-slot:append>
                <v-btn icon="mdi-clipboard-edit-outline" @click="openAddPopup()"></v-btn>
                <v-btn icon="mdi-gas-station" @click="openFuelPopup()"></v-btn>
            </template>
            <AppBarTitle :onIconClick="selectData" :refreshIcon="refreshIcon" />
            <v-app-bar-title>{{ mileageText }} ㎞</v-app-bar-title>
        </v-app-bar>
        <v-main>
            <v-tabs v-model="tab" bg-color="#202020">
                <v-tab value="SORENTO">SORENTO</v-tab>
                <v-tab value="SM6">SM6</v-tab>
            </v-tabs>
            <v-card class="mt-2 mx-4" variant="flat">
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span>엔진오일</span>
                    <span>{{ forecateDate }}</span>
                </div>
                <v-progress-linear :color="getProgressColor(oilMileage / oilChangeMileage * 100)" height="12"
                    :max="oilChangeMileage" v-model="oilMileage"
                    :style="{ color: getProgressTextColor(oilMileage / oilChangeMileage * 100), fontSize: '9px' }"
                    rounded>{{
                        oilMileage.toLocaleString()
                    }}</v-progress-linear>
            </v-card>
            <v-data-table :headers="headers" :items="list.filter(item => item.category !== '주행거리')"
                no-data-text="조회중입니다." loading-text="조회중입니다." items-per-page=9 v-model:page="currentPage"
                @click:row="onRowClick">
                <template v-slot:item.date="{ item }">
                    <span>
                        {{ item.date.slice(0, 4) }}. {{ Number(item.date.slice(4, 6)) }}. {{ Number(item.date.slice(6,
                            8)) }}
                    </span>
                </template>
                <template v-slot:item.category="{ item }" @click="openDetailPopup(item)">
                    <span>
                        {{ item.category.length > 12 ? item.category.substring(0, 12) + "..." : item.category }}
                    </span>
                </template>
                <template v-slot:item.mileage="{ item }" @click="openDetailPopup(item)">
                    <span>
                        {{ item.mileage.toLocaleString() }}
                    </span>
                </template>
            </v-data-table>
        </v-main>
        <v-dialog v-model="isPopup" max-width="380px">
            <v-card class="pa-4">
                <v-card-title>정비내역{{ isPopupKind === 'ADD' ? ' 등록' : '' }}</v-card-title>
                <v-text-field label="날짜" v-model="addData.date" type="date" />
                <v-combobox v-model="addData.category" label="항목" :items="comboList"></v-combobox>
                <v-text-field v-model="addData.mileage" label="주행거리" type="number" clearable />
                <v-text-field v-if="addData.category === '기름'" v-model="addData.liter" label="주유량" type="number"
                    clearable />
                <v-text-field v-if="addData.category !== '주행거리'" v-model="addData.cost" label="비용" type="number" clearable />
                <v-text-field v-model="addData.remark" label="비고" clearable />

                <v-card-actions>
                    <v-btn @click="addAction()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="deleteData()" :disabled="isPopupKind === 'ADD'" icon="mdi-delete"></v-btn>
                    <v-btn @click="isPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="isFuelPopup" max-width="380px">
            <v-card>
                <v-card-title>주유비</v-card-title>
                <v-container>
                    <v-text-field label="날짜" v-model="addData.date" type="date" />
                    <v-text-field v-model="addData.mileage" label="주행거리" type="number" clearable />
                    <v-row no-gutters>
                        <v-col cols="10">
                            <v-number-input v-model="carBook.fuel.unitCost" label="단가" :min="1000" :step="10"
                                clearable />
                        </v-col>
                        <v-col cols="2">
                            <v-btn icon="mdi-calculator" variant="flat" @click="calcFuelAmount('COST')"></v-btn>
                        </v-col>
                    </v-row>
                    <v-row no-gutters>
                        <v-col cols="10">
                            <v-number-input v-model="carBook.fuel.liter" label="주유량(ℓ)" :min="1" :step="5" clearable />
                        </v-col>
                        <v-col cols="2">
                            <v-btn icon="mdi-calculator" variant="flat" @click="calcFuelAmount('LITER')"></v-btn>
                        </v-col>
                    </v-row>
                    <v-row no-gutters>
                        <v-col cols="10">
                            <v-number-input v-model="fuelAmount" label="금액" :min="0" :step="1000" clearable />
                        </v-col>
                        <v-col cols="2">
                            <v-btn icon="mdi-calculator" variant="flat" @click="calcFuelAmount('AMOUNT')"></v-btn>
                        </v-col>
                    </v-row>
                </v-container>
                <v-card-actions>
                    <v-btn @click="addFuel()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="isFuelPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<style scoped></style>
