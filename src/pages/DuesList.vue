<script setup>
import { ref, onMounted } from 'vue';
import { useLogger } from '../composables/useLogger';
import { AppBarTitle } from '../composables/getRouteInfo';

useLogger();

const API_KEY = 'AIzaSyAjcEIdV46fa6Kw3Hdyzf3No_3cXtScRLc'; // 본인의 Google API Key 입력
const SHEET_ID = '1-NlBFmwdIZop6pDvasfBtT7sn1jdwIfuCTq4bcHvN0s'; // 본인의 Sheet ID 입력
const RANGE = '시트1'; // 원하는 범위 지정

const headers = ref([
    { title: '날짜', align: 'start', key: 'date', value: 'date', width: 110 },
    { title: '여행지', align: 'start', key: 'destination', value: 'destination' },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
]);

const rows = ref([]);
const isSumPopup = ref(false);
const totalUnadjustedAmount = ref(0);

function openSumPopup() {
    isSumPopup.value = true;

    // adjust가 "N"인 amount의 합계 계산
    const total = rows.value
        .filter(row => row.adjust === 'N')
        .reduce((sum, row) => {
            // 쉼표 제거 후 숫자로 변환
            const amount = parseFloat((row.amount || '0').replace(/,/g, ''));
            return sum + amount;
        }, 0);

    // 숫자를 127,400원 형식으로 포맷팅
    totalUnadjustedAmount.value = new Intl.NumberFormat('ko-KR').format(total) + '원';
}

onMounted(async () => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const rawRows = data.values.slice(1); // 첫 번째 행은 헤더이므로 제외
        rows.value = rawRows.map(row => ({
            date: row[0], // 1열: 날짜
            destination: row[1], // 2열: 여행지
            expense: row[2], // 3열: 지출내역
            amount: row[3], // 4열: 금액
            adjust: row[4], // 5열: 정산여부
        }));

        // 1열(날짜) 기준으로 내림차순 정렬
        rows.value.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA; // 내림차순 정렬
        });


        //console.log('Fetched data:', rows.value);
        //console.log("totalUnadjustedAmount", totalUnadjustedAmount.value);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});
</script>

<template>
    <v-app>
        <v-main>
            <v-app-bar color="teal-darken-4"> <!--image="https://picsum.photos/1920/1080?random-->
                <template v-slot:image>
                    <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
                </template>
                <template v-slot:append>
                    <v-btn icon="mdi-calculator" @click="openSumPopup()"></v-btn>
                </template>
                <AppBarTitle />
            </v-app-bar>

            <v-data-table :headers="headers" :items="rows" class="elevation-1" no-data-text="조회중입니다."
                hide-default-footer items-per-page="-1" :show-items-per-page="false">
                <template v-slot:item.destination="{ item }">
                    {{ item.destination }}<br>
                    <span style="font-size: 12px; color:gray">{{ item.expense }}</span>
                </template>

                <template v-slot:item.amount="{ item }">
                    <span :style="{ color: item.adjust === 'Y' ? 'black' : 'red' }">{{ item.amount }}</span>
                </template>

                <!-- 페이지네이션 버튼 중앙 정렬 -->
                <template v-slot:footer.page-text>
                    <div class="text-center">
                        <v-pagination v-model="page" :length="Math.ceil(rows.length / 14)"
                            total-visible="7"></v-pagination>
                    </div>
                </template>
            </v-data-table>
            <v-dialog v-model="isSumPopup" max-width="600px">
                <v-card>
                    <v-card-title class="headline">미정산 금액</v-card-title>
                    <v-card-text>
                        <p>{{ totalUnadjustedAmount }}</p>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn text @click="isSumPopup = false">닫기</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-main>
    </v-app>
</template>