<script setup>
import { ref, onMounted } from 'vue'
import { useLogger } from '../composables/useLogger';
import html2canvas from 'html2canvas';

// useLogger();

const rows = ref([]);
const usageSummary = ref([]);
const usageDetail = ref([]);

const API_KEY = 'AIzaSyAjcEIdV46fa6Kw3Hdyzf3No_3cXtScRLc'; // 본인의 Google API Key 입력
const SHEET_ID = '1z9zfiUomAKR99RLNblL4melEgFexRIGdYgbewhTIB38'; // 본인의 Sheet ID 입력

const headers = [
    { title: '날짜', align: 'start', key: 'date', value: 'date', width: 200 },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
];

const usageHeaders = [
    { title: '제품', align: 'start', key: 'name', value: 'name' },
    { title: '수량', align: 'end', sortable: false, key: 'qty', value: 'qty' },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
];

const tab = ref(null);

// const phoneNumber = ref('01092751025')

// function sendSMS() {
//     const smsLink = `sms:${phoneNumber.value}?body=${encodeURIComponent(msg.value)}`
//     window.location.href = smsLink
// }

// function formatSMSMessage() {
//     const msgRows = [...rows.value];
//     msgRows.splice(msgRows.length - 1, 0, { date: "--------------------", amount: "" });

//     msg.value = msgRows
//         .map(row => `${row.date}     \t${row.amount}${row.date.substring(0, 1) === "-" ? "" : "원"}`) // 각 행을 "날짜\t금액원" 형식으로 변환
//         .join('\n'); // 각 행을 줄바꿈으로 연결
// }

// function textShare() {
//     formatSMSMessage();

//     navigator.share({
//         //title: '선결제내역 공유',
//         text: msg.value,
//     });
// }
async function getPrepayment() {
    const RANGE = '뚜레쥬르'; // 원하는 범위 지정
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


    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function getUsage() {
    const RANGE = '뚜레쥬르 사용'; // 원하는 범위 지정
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const rawRows = data.values;

        usageSummary.value = rawRows.slice(0, 3)
            .map(row => (row[1]));

        //console.log("raw", rawRows.slice(1).filter(row => row[5] > "0"));

        usageDetail.value = rawRows.slice(1)
            .filter(row => row[5] > "0")
            .map(row => ({
                name: row[3],
                qty: row[4],
                amount: row[5],
            }));

        //console.log("sum", usageSummary.value);
        //console.log("detail", usageDetail.value);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

onMounted(async () => {
    getPrepayment();
    getUsage();
});

async function shareTableAsImage() {
    const tableElement = document.getElementById(tab.value + "Table"); // v-data-table 요소 선택
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
            <v-tabs v-model="tab" bg-color="primary">
                <v-tab value="prepayment">선결제 내역</v-tab>
                <v-tab value="usage">사용내역</v-tab>
            </v-tabs>

            <v-tabs-window v-model="tab">
                <v-tabs-window-item value="prepayment">
                    <v-data-table id="prepaymentTable" :headers="headers" :items="rows" no-data-text="조회중입니다."
                        loading-text="조회중입니다." hide-default-footer items-per-page="-1" :show-items-per-page="false">
                        <template v-slot:item="{ item, index }">
                            <tr :style="item.date === '합계' ? 'background-color: #fffad4 !important;' : ''">
                                <td>{{ item.date }}</td>
                                <td :style="{
                                    textAlign: 'right',
                                    fontWeight: item.date === '합계' ? 'bold' : 'normal',
                                    color: item.date === '합계' ? 'blue' : 'black'
                                }">
                                    {{ item.amount }}
                                </td>
                            </tr>
                        </template>
                    </v-data-table>
                </v-tabs-window-item>
                <v-tabs-window-item value="usage">
                    <v-card class="mx-auto" elevation="4">
                        <v-data-table id="usageTable" :items="usageSummary" hide-default-header hide-default-footer
                            items-per-page="-1" :show-items-per-page="false">
                            <template v-slot:item="{ item, index }">
                                <tr class="text-no-wrap">
                                    <td style="background-color: rgb(199, 221, 162);">{{ index === 0 ? '선결제금액' : index
                                        === 1 ? '사용금액' : '잔여금액' }}</td>
                                    <td style="text-align: right;">{{ item }}</td>
                                </tr>
                            </template>
                        </v-data-table>
                    </v-card>
                    <v-card class="mx-auto my-8" elevation="4" max-width="344">
                        <v-data-table :headers="usageHeaders" :items="usageDetail" hide-default-footer
                            items-per-page="-1" :show-items-per-page="false">
                        </v-data-table>
                    </v-card>
                </v-tabs-window-item>
            </v-tabs-window>
        </v-main>
    </v-app>
</template>

<style scoped>
::v-deep(#prepaymentTable .v-data-table__th) {
    font-size: 28px;
    font-weight: bold;
    background-color: rgb(199, 221, 162);
}

tr {
    height: 60px !important;
    /* 원하는 높이로 설정 */
}

td {
    font-size: 28px;
}
</style>