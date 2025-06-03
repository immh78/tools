<script setup>
import { ref, onMounted, watch } from 'vue'
import { useLogger } from '../composables/useLogger';
import { database, ref as firebaseRef, get, update, remove } from "../config/firebase";

//useLogger();


const carBook = ref({});
const tab = ref("SORENTO");
const mileageSORENTO = ref(0);
const mileageSM6 = ref(0);
const mileage = ref(0);
const lastChangeOilSORENTO = ref(0);
const lastChangeOilSM6 = ref(0);
const oilMileage = ref(0);
const oilChangeMileage = 15000;
const listSORENTO = ref([]);
const listSM6 = ref([]);
const list = ref([]);

const headers = [
    { title: '날짜', align: 'center', key: 'date', value: 'date' },
    { title: '항목', align: 'start', key: 'category', value: 'category' },
    { title: '비용', align: 'end', key: 'cost', value: 'cost' },
    { title: '비고', align: 'start', key: 'remark', value: 'remark' },
];

async function selectData() {
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

    console.log("* carBook", carBook.value);

    listSORENTO.value = sortData(carBook.value.SORENTO);
    listSM6.value = sortData(carBook.value.SM6);

    console.log("listSORENTO", listSORENTO.value);
    console.log("listSM6", listSM6.value);

    mileageSORENTO.value = calcEstimatedMileage(listSORENTO.value);
    mileageSM6.value = calcEstimatedMileage(listSM6.value);

    console.log("mileageSORENTO", mileageSORENTO.value);
    console.log("mileageSM6", mileageSM6.value);

    lastChangeOilSORENTO.value = getLastChangeOilMileage(listSORENTO.value);
    lastChangeOilSM6.value = getLastChangeOilMileage(listSM6.value);

    console.log("lastChangeOilSORENTO", lastChangeOilSORENTO.value);
    console.log("lastChangeOilSM6", lastChangeOilSM6.value);
}

function parseDate(dateStr) {
    const year = parseInt(dateStr.slice(0, 4))
    const month = parseInt(dateStr.slice(4, 6)) - 1
    const day = parseInt(dateStr.slice(6, 8))
    return new Date(year, month, day)
}

function sortData(data) {
    return [...data].sort((a, b) => parseDate(b.date) - parseDate(a.date));
}

function calcEstimatedMileage(data) {
    // 마지막 두 항목을 날짜 순으로 정렬 후 가져오기
    const sortedData = data;
    const latest = sortedData[0];
    let previous = {};

    for (let i = 1; i < sortedData.length; i++) {
        if (latest.date > sortedData[i].date) {
            previous = sortedData[i];
            break;
        }
    }

    console.log("parseDate", previous.date, latest.date)
    const date1 = parseDate(previous.date)
    const date2 = parseDate(latest.date)

    const mileage1 = previous.mileage
    const mileage2 = latest.mileage

    const daysDiff = (date2 - date1) / (1000 * 60 * 60 * 24)
    const mileageDiff = mileage2 - mileage1

    const avgPerDay = mileageDiff / daysDiff

    const today = new Date()
    const daysSinceLast = (today - date2) / (1000 * 60 * 60 * 24)

    return mileage2 + Math.round(avgPerDay * daysSinceLast)
}

function getLastChangeOilMileage(data) {
    console.log("filter data", data.filter(item => item.category === '엔진오일'))

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
    if (newTab === "SORENTO") {
        mileage.value = mileageSORENTO.value;
        oilMileage.value = mileageSORENTO.value - lastChangeOilSORENTO.value;
        list.value = listSORENTO.value;


    } else {
        mileage.value = mileageSM6.value;
        oilMileage.value = mileageSM6.value - lastChangeOilSM6.value;
        list.value = listSM6.value;
    }
}

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

onMounted(async () => {
    await selectData();
    changeTab(tab.value);

});
</script>

<template>
    <v-app>
        <v-main>
            <v-app-bar color="teal-darken-4">
                <template v-slot:image>
                    <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
                </template>
                <v-app-bar-title><v-icon>mdi-car-wrench</v-icon> 차계부</v-app-bar-title>
            </v-app-bar>
            <v-tabs v-model="tab" bg-color="#202020">
                <v-tab value="SORENTO">SORENTO</v-tab>
                <v-tab value="SM6">SM6</v-tab>
            </v-tabs>
            <v-sheet>
                <v-text-field v-model="mileage" label="주행거리"></v-text-field>
                <v-progress-linear :location="null" :color="getProgressColor(oilMileage / oilChangeMileage * 100)"
                    height="20" :max="oilChangeMileage" v-model="oilMileage" rounded>{{ oilMileage
                    }}</v-progress-linear>
            </v-sheet>
            <v-data-table :headers="headers" :items="list" no-data-text="조회중입니다." loading-text="조회중입니다."
                hide-default-footer items-per-page="-1" :show-items-per-page="false">
            </v-data-table>
        </v-main>
    </v-app>
</template>

<style scoped></style>
