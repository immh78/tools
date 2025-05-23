<script setup>
import { ref, onMounted } from 'vue'

const rows = ref([]);
const msg = ref("");

const API_KEY = 'AIzaSyAjcEIdV46fa6Kw3Hdyzf3No_3cXtScRLc'; // 본인의 Google API Key 입력
const SHEET_ID = '1z9zfiUomAKR99RLNblL4melEgFexRIGdYgbewhTIB38'; // 본인의 Sheet ID 입력
const RANGE = '뚜레쥬르'; // 원하는 범위 지정

const phoneNumber = ref('01092751025')

function sendSMS() {
    const smsLink = `sms:${phoneNumber.value}?body=${encodeURIComponent(msg.value)}`
    window.location.href = smsLink
}

function formatSMSMessage() {
  msg.value = rows.value
    .map(row => `${row.date}\t${row.amount}원`) // 각 행을 "날짜\t금액원" 형식으로 변환
    .join('\n'); // 각 행을 줄바꿈으로 연결
}


onMounted(async () => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const rawRows = data.values.slice(1); // 첫 번째 행은 헤더이므로 제외
        rows.value = rawRows
             .filter(row => row[0] !== undefined)
             .map(row => ({
            date: row[0], // 1열: 날짜
            amount: row[1], // 2열: 금액            
        }));


        formatSMSMessage();

        console.log('Fetched data:', msg.value);        
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});
</script>

<template>
    <div>
        <button @click="sendSMS">SMS 보내기</button>
    </div>
</template>

