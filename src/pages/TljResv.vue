<script setup>
import { ref, onMounted } from 'vue'
import { useLogger } from '../composables/useLogger';
import html2canvas from 'html2canvas';
import { database, ref as firebaseRef, get, update } from "../config/firebase";

//useLogger();

const isPrepayPopup = ref(false);

const tljResv = ref({});
const tab = ref("");
const summary = ref({
    prepayment: 0,
    reservation: 0
});

const prepayTab = ref([]);
const resvTab = ref([]);


const prepayHeaders = [
    { title: '날짜', align: 'start', key: 'date', value: 'date', width: 200 },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
];

const resvHeaders = [
    { title: '제품', align: 'start', key: 'product', value: 'product' },
    { title: '수량', align: 'center', sortable: false, key: 'qty', value: 'qty' },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
];

async function selectDate() {
    const dbRef = firebaseRef(database, "tlj-resv");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                tljResv.value = snapshot.val();
            }
        })
        .catch(err => {
            console.error("Error fetching data:", err);
        });



    // Calculate sum
    summary.value.prepayment = tljResv.value.prepayment.reduce((sum, item) => sum + item.amount, 0);
    summary.value.reservation = tljResv.value.reservation.reduce((sum, item) => sum + item.amount, 0);

    const prepaymentKeys = Object.keys(tljResv.value.prepayment).map(Number)
    prepaymentKeys.forEach(key => {
        const itemPrepay = tljResv.value.prepayment[key];
        itemPrepay.key = key;  // 각 항목에 key 값을 추가
        prepayTab.value.push(itemPrepay);
    });

    const reservationKeys = Object.keys(tljResv.value.reservation).map(Number)
    reservationKeys.forEach(key => {
        const itemResv = tljResv.value.reservation[key];
        itemResv.key = key;  // 각 항목에 key 값을 추가
        resvTab.value.push(itemResv);
    });

    prepayTab.value.push({
        "amount": summary.value.prepayment,
        "date": "합계"
    });

    resvTab.value.push({
        "amount": summary.value.reservation,
        "product": "합계"
    });


    console.log("* Prepayment:", prepayTab.value);
    console.log("* Reservation:", resvTab.value);
    console.log("* Summary:", summary.value);
    console.log("* tljResv:", tljResv.value);

}

async function shareTableAsImage() {

    let title = "";
    let textX = 0;
    let textY = 0;

    switch (tab.value) {
        case 'prepayment':
            title = '선결제 내역';
            textX = -70;
            textY = 340;
            break;

        case 'summary':
            title = '사용 내역';
            textX = -20;
            textY = 300;
            break;

        case 'reservation':
            title = '구매 희망 제품';
            textX = -110;
            textY = 360;
            break;

        default:
            break;
    }

    const tableElement = document.getElementById(tab.value + "Table"); // v-data-table 요소 선택

    if (!tableElement) {
        console.error('Table element not found');
        return;
    }

    try {
        // html2canvas로 테이블 캡처
        const canvas = await html2canvas(tableElement);
        const context = canvas.getContext('2d');

        // 텍스트 추가
        const fontSize = 60; // 텍스트 폰트 크기
        //console.log(textX, textY);
        // 반투명 텍스트 설정
        context.globalAlpha = 0.05; // 투명도 설정 (0.0 ~ 1.0)
        context.font = `bold ${fontSize}px Arial`;
        context.fillStyle = "#000000"; // 검은색 텍스트
        context.textAlign = "left";
        // 텍스트를 대각선으로 회전 (45도)
        context.rotate(-0.4);
        context.fillText(title, textX, textY);

        // 이미지 변환
        const image = canvas.toDataURL('image/png');

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


function openPrepayPopup() {

}

async function prepayAdd() {
    const prepaymentKeys = Object.keys(tljResv.value.prepayment).map(Number); // 문자열이 아닌 숫자로 변환

    // 0부터 순차적으로 증가하며 비어있는 값을 찾기
    let nextKey = 0;

    while (prepaymentKeys.includes(nextKey)) {
        nextKey++;
    }

    const data = {
        [nextKey]: {
            "amount": 900,
            "date": '20250529'
        }
    }

    try {
        const dbRef = firebaseRef(database, "tlj-resv/prepayment");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

onMounted(async () => {
    selectDate();
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
                    <v-btn icon="mdi-send" @click="shareTableAsImage()"></v-btn>
                </template>
                <v-app-bar-title><v-icon>mdi-cupcake</v-icon> 뚜레쥬르 식권대장 예약</v-app-bar-title>
            </v-app-bar>
            <v-tabs v-model="tab" bg-color="#202020">
                <v-tab value="prepayment">선결제 내역</v-tab>
                <v-tab value="summary">사용내역</v-tab>
                <v-tab value="reservation">사용상세내역</v-tab>
            </v-tabs>
            <v-tabs-window v-model="tab">
                <v-tabs-window-item value="prepayment">
                    <v-data-table id="prepaymentTable" :headers="prepayHeaders"
                        :items="prepayTab.filter(item => item !== undefined)" no-data-text="조회중입니다."
                        loading-text="조회중입니다." hide-default-footer items-per-page="-1" :show-items-per-page="false">
                        <template v-slot:item="{ item }">
                            <tr :style="item.date === '합계' ? 'background-color: #fffad4 !important;' : ''">
                                <td>{{ item.date === '합계' ? '합계' : item.date.slice(4, 6) + '/'
                                    + item.date.slice(6, 8)
                                    }}</td>
                                <td :style="{
                                    textAlign: 'right',
                                    fontWeight: item.date === '합계' ? 'bold' : 'normal',
                                    color: item.date === '합계' ? 'blue' : 'black'
                                }">
                                    {{ item.amount.toLocaleString() }}
                                </td>
                            </tr>
                        </template>
                    </v-data-table>
                    <v-btn @click="isPrepayPopup = true">추가</v-btn>
                </v-tabs-window-item>
                <v-tabs-window-item value="summary">
                    <v-container id="summaryTable">
                        <v-row><v-col class="sum-header">선결제금액</v-col><v-col class="sum-value d-flex justify-end">{{
                            summary.prepayment.toLocaleString() }}</v-col></v-row>
                        <v-row><v-col class="sum-header">사용금액</v-col><v-col class="sum-value d-flex justify-end">{{
                            summary.reservation.toLocaleString() }}</v-col></v-row>
                        <v-row><v-col class="sum-header">잔여금액</v-col><v-col class="sum-value d-flex justify-end">{{
                            (summary.prepayment - summary.reservation).toLocaleString()
                                }}</v-col></v-row>
                    </v-container>
                </v-tabs-window-item>
                <v-tabs-window-item value="reservation">
                    <v-card class="mx-auto" elevation="4">
                        <v-data-table id="reservationTable" :headers="resvHeaders" :items="resvTab" hide-default-footer
                            items-per-page="-1" :show-items-per-page="false">
                            <template v-slot:item="{ item, index }">
                                <tr :style="item.product === '합계' ? 'background-color: #fffad4 !important;' : ''">
                                    <td>{{ item.product }}</td>
                                    <td style="text-align: center;">{{ item.qty }}</td>
                                    <td :style="{
                                        textAlign: 'right',
                                        fontWeight: item.date === '합계' ? 'bold' : 'normal',
                                        color: item.date === '합계' ? 'blue' : 'black'
                                    }">
                                        {{ item.amount.toLocaleString() }}
                                    </td>
                                </tr>
                            </template>
                        </v-data-table>
                    </v-card>
                </v-tabs-window-item>
            </v-tabs-window>
        </v-main>

        <v-dialog v-model="isPrepayPopup" max-width="600px">
            <v-card>
                <v-card-title>선결제 내역 추가</v-card-title>
                <v-card-text>
                    <v-text-field label="날짜" v-model="tljResv.prepayment.date" />
                    <v-text-field label="금액" v-model="tljResv.prepayment.amount" type="number" />
                </v-card-text>
                <v-card-actions>
                    <v-btn color="primary" @click="prepayAdd">추가</v-btn>
                    <v-btn @click="isPrepayPopup = false">닫기</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<style scoped>
::v-deep(.v-data-table__th) {
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

.sum-header {
    font-size: 28px;
    font-weight: bold;
    background-color: rgb(199, 221, 162);
}

.sum-value {
    font-size: 28px;
}
</style>
