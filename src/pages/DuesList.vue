<script setup>
import { ref, onMounted } from 'vue';

const API_KEY = 'AIzaSyCEPaxRsfZoKOSzjnxqFyuCtchTyNwFrp0'; // 본인의 Google API Key 입력
const SHEET_ID = '1-NlBFmwdIZop6pDvasfBtT7sn1jdwIfuCTq4bcHvN0s'; // 본인의 Sheet ID 입력
const RANGE = '시트1'; // 원하는 범위 지정

const headers = ref([
    { title: '날짜', align: 'start', key: 'date', value: 'date' },
    { title: '여행지', align: 'start', key: 'destination', value: 'destination' },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
]);

const rows = ref([]);

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
                <v-app-bar-title><v-icon>mdi-umbrella-beach</v-icon> 우미린 가족여행 경비목록</v-app-bar-title>
            </v-app-bar>

            <v-data-table :headers="headers" 
                          :items="rows" 
                          class="elevation-1" 
                          no-data-text="조회중입니다."
                          items-per-page="14" 
                          :show-items-per-page="false" 
                >
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
                        <v-pagination 
                            v-model="page" 
                            :length="Math.ceil(rows.length / 14)" 
                            total-visible="7"
                        ></v-pagination>
                    </div>
                </template>                
            </v-data-table>
        </v-main>
    </v-app>
</template>