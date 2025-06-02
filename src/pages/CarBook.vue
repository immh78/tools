<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLogger } from '../composables/useLogger';
import { database, ref as firebaseRef, get, update, remove } from "../config/firebase";

//useLogger();


const carBook = ref({});
const tab = ref("");
const estimatedMileage = ref(0);


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

    estimatedMileage.value = calcEstimatedMileage(carBook.value.SORENTO);

    console.log("estimatedMileage.value", estimatedMileage.value);
    console.log("SM6", calcEstimatedMileage(carBook.value.SM6))

}

function calcEstimatedMileage(data) {
    // 날짜를 Date 객체로 변환
    const parseDate = (dateStr) => {
        const year = parseInt(dateStr.slice(0, 4))
        const month = parseInt(dateStr.slice(4, 6)) - 1
        const day = parseInt(dateStr.slice(6, 8))
        return new Date(year, month, day)
    }

    // 마지막 두 항목을 날짜 순으로 정렬 후 가져오기
    const sortedData = [...data].sort((a, b) => parseDate(b.date) - parseDate(a.date));

    const latest = sortedData[0];
    let previous = {};

    for (let i = 1; i < sortedData.length; i++) {
        if (latest.date > sortedData[i].date) {
            previous = sortedData[i];
            break;
        }
    }
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
                <v-app-bar-title><v-icon>mdi-car-wrench</v-icon> 차계부</v-app-bar-title>
            </v-app-bar>
        </v-main>
    </v-app>
</template>

<style scoped></style>
