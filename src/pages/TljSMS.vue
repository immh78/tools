<script setup>
import { ref, onMounted } from 'vue'
import { useLogger } from '../composables/useLogger';
import html2canvas from 'html2canvas';

useLogger();

const rows = ref([]);
const msg = ref("");

const API_KEY = 'AIzaSyAjcEIdV46fa6Kw3Hdyzf3No_3cXtScRLc'; // 본인의 Google API Key 입력
const SHEET_ID = '1z9zfiUomAKR99RLNblL4melEgFexRIGdYgbewhTIB38'; // 본인의 Sheet ID 입력
const RANGE = '뚜레쥬르'; // 원하는 범위 지정

const headers = ref([
    { title: '날짜', align: 'start', key: 'date', value: 'date', width: 110 },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
]);

const phoneNumber = ref('01092751025')

function sendSMS() {
    const smsLink = `sms:${phoneNumber.value}?body=${encodeURIComponent(msg.value)}`
    window.location.href = smsLink
}

function formatSMSMessage() {
    const msgRows = [...rows.value];
    msgRows.splice(msgRows.length - 1, 0, { date: "--------------------", amount: "" });

    msg.value = msgRows
        .map(row => `${row.date}     \t${row.amount}${row.date.substring(0, 1) === "-" ? "" : "원"}`) // 각 행을 "날짜\t금액원" 형식으로 변환
        .join('\n'); // 각 행을 줄바꿈으로 연결
}

function textShare() {
    formatSMSMessage();

    navigator.share({
        //title: '선결제내역 공유',
        text: msg.value,
    });
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

        //console.log(rows.value);


        //console.log('Fetched data:', msg.value);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

async function shareTableAsImage() {
    const tableElement = document.querySelector('.v-data-table'); // v-data-table 요소 선택
    if (!tableElement) {
        console.error('Table element not found');
        return;
    }

    try {
        const canvas = await html2canvas(tableElement); // html2canvas로 캡처
        const image = canvas.toDataURL('image/png'); // 이미지를 Data URL로 변환

        // 공유 API 사용
        if (navigator.share) {
            await navigator.share({
                title: '선결제 내역',
                text: '아래 이미지를 확인하세요.',
                files: [new File([await (await fetch(image)).blob()], 'table.png', { type: 'image/png' })],
            });
        } else {
            alert('공유 API를 지원하지 않는 브라우저입니다.');
        }
    } catch (error) {
        console.error('Error sharing table as image:', error);
    }
}
</script>

<template>
    <v-app>
        <v-main>
            <v-app-bar color="teal-darken-4"> <!--image="https://picsum.photos/1920/1080?random-->
                <template v-slot:image>
                    <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
                </template>
                <template v-slot:append>
                    <v-btn icon="mdi-send" @click="shareTableAsImage()"></v-btn>
                </template>
                <v-app-bar-title><v-icon>mdi-cupcake</v-icon> 뚜레쥬르 선결제 금액</v-app-bar-title>
            </v-app-bar>

            <v-data-table :headers="headers" :items="rows" class="elevation-1" no-data-text="조회중입니다."
                hide-default-footer items-per-page="-1" :show-items-per-page="false">
                <template v-slot:item="{ item, index }">
                    <tr :style="item.date === '합계' ? 'background-color: #fffad4 !important;' : ''">
                        <td>{{ item.date }}</td>
                        <td style="text-align: right;">{{ item.amount }}</td>
                    </tr>
                </template>
            </v-data-table>
        </v-main>
    </v-app>
</template>

<style scoped></style>