<script setup>
import { ref, onMounted, watch } from 'vue'
import { useLogger } from '../composables/useLogger';
import html2canvas from 'html2canvas';
import { database, ref as firebaseRef, get, update, remove } from "../config/firebase";
import { AppBarTitle } from '../composables/getRouteInfo';


useLogger();


const tljResv = ref({});
const tab = ref("");
const summary = ref({
    prepayment: 0,
    reservation: 0
});

const isPrepayPopup = ref(false);
const isPrepayAdd = ref(false);
const prepayTab = ref([]);
const resvTab = ref([]);
const prepayItem = ref({});
const prepayKey = ref("");

const isResvPopup = ref(false);
const isResvAdd = ref(false);
const productTab = ref([]);
const resvItem = ref({});
const resvKey = ref("");

const isConfirmPopup = ref(false);
const confirmAction = ref("");

const prepayHeaders = [
    { title: '날짜', align: 'start', key: 'date', value: 'date', width: 200 },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
];

const resvHeaders = [
    { title: '제품', align: 'start', key: 'product', value: 'product' },
    { title: '수량', align: 'center', sortable: false, key: 'qty', value: 'qty' },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
];

async function selectData() {
    const dbRef = firebaseRef(database, "tlj-resv");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                tljResv.value = snapshot.val();
            }
        })
        .catch(err => {
            //console.error("Error fetching data:", err);
        });

    // Calculate sum
    prepayTab.value = [];
    if (tljResv.value.prepayment) {
        summary.value.prepayment = tljResv.value.prepayment.reduce((sum, item) => sum + item.amount, 0);

        const prepaymentKeys = Object.keys(tljResv.value.prepayment).map(Number)

        prepaymentKeys.forEach(key => {
            const itemPrepay = tljResv.value.prepayment[key];
            itemPrepay.key = key;  // 각 항목에 key 값을 추가
            prepayTab.value.push(itemPrepay);
        });

    } else {
        summary.value.prepayment = 0;
    }

    resvTab.value = [];
    if (tljResv.value.reservation) {
        summary.value.reservation = tljResv.value.reservation.reduce((sum, item) => sum + item.amount, 0);
        const reservationKeys = Object.keys(tljResv.value.reservation).map(Number)

        reservationKeys.forEach(key => {
            const itemResv = tljResv.value.reservation[key];
            itemResv.key = key;  // 각 항목에 key 값을 추가
            resvTab.value.push(itemResv);
        });
    } else {
        summary.value.reservation = 0;
    }


    prepayTab.value.push({
        "amount": summary.value.prepayment,
        "date": "합계"
    });

    resvTab.value.push({
        "amount": summary.value.reservation,
        "product": "합계"
    });

    // 상품명 리스트
    productTab.value = Object.keys(tljResv.value.product);


    //console.log("* Prepayment:", prepayTab.value);
    //console.log("* Reservation:", resvTab.value);
    //console.log("* Summary:", summary.value);
    //console.log("* product:", productTab.value);
    //console.log("* tljResv:", tljResv.value);

}

async function shareTableAsImage() {


    let title = "";
    let image = "";

    switch (tab.value) {
        case 'prepayment':
            title = '선결제 내역';
            image = "piggy-bank";
            break;
        case 'summary':
            title = '사용 내역';
            image = "calculator";
            break;
        case 'reservation':
            title = '구매 희망 제품';
            image = "notes"
            break;
        default:
            break;
    }

    const tableElement = document.getElementById(tab.value + "Table");

    if (!tableElement) {
        console.error('Table element not found');
        return;
    }

    try {
        const canvas = await html2canvas(tableElement);
        const context = canvas.getContext('2d');

        const iconImage = new Image();
        iconImage.src = new URL(`../assets/${image}.png`, import.meta.url).href;
        //iconImage.src = piggyBankImg;
        
        iconImage.onload = async () => {
            // 높이 60%에 맞춰 정사각형으로 아이콘 크기 설정
            const baseLength = Math.min(canvas.width, canvas.height) / 2;
            const iconSize = baseLength * 0.6;
            //const mobileWidth = window.innerWidth;

            //console.log("mobileWith", mobileWidth, canvas.width);

            // canvas 중앙 위치 계산
            const imageX = (canvas.width / 2 - iconSize) / 2;
            const imageY = 170; //canvas.height / 3.5;

            //console.log("imageX:", imageX, "imageY:", imageY, "iconSize:", iconSize);
            //console.log("canvas width:", canvas.width /2, "canvas height:", canvas.height /2);

            // 투명도 및 이미지 그리기
            context.globalAlpha = 0.15;
            context.drawImage(iconImage, imageX, imageY, iconSize, iconSize);

            const image = canvas.toDataURL('image/png');

            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: '아래 이미지를 확인하세요.',
                    files: [new File([await (await fetch(image)).blob()], 'table.png', { type: 'image/png' })],
                });
            } else {
                alert('공유 API를 지원하지 않는 브라우저입니다.');
            }
        };

        iconImage.onerror = () => {
            console.error('아이콘 이미지 로드 실패');
        };

    } catch (error) {
        console.error('Error sharing table as image:', error);
    }
}


function openPrepayPopup(item) {
    //console.log("* item:", item);
    let key = 0;
    let d = "";
    let amount = 0;

    if (item == null) {
        isPrepayAdd.value = true;
        key = getPrepaymentNewKey();

        d = formatDate("-", getToday());
    } else {
        isPrepayAdd.value = false;
        key = item.key;
        d = formatDate("-", item.date);
        amount = item.amount;
    }
    prepayKey.value = key;
    prepayItem.value = { "date": d, "amount": amount };

    isPrepayPopup.value = true;
}

function getPrepaymentNewKey() {
    let key = 0;
    if (tljResv.value.prepayment) {
        const prepaymentKeys = Object.keys(tljResv.value.prepayment).map(Number); // 문자열이 아닌 숫자로 변환
        // 0부터 순차적으로 증가하며 비어있는 값을 찾기
        while (prepaymentKeys.includes(key)) {
            key++;
        }
    } else {
        key = 0;
    }

    return key;
}


async function prepayUpdate() {
    const d = formatDate("", prepayItem.value.date);
    const data = {
        [prepayKey.value]: {
            "amount": Number(prepayItem.value.amount),
            "date": d
        }
    }

    //console.log("* save data", data);

    try {
        const dbRef = firebaseRef(database, "tlj-resv/prepayment");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isPrepayPopup.value = false;

    selectData();
}

async function prepayDelete(target) {
    let key = "";

    if (target != null) {
        key = "/" + prepayKey.value;
    }

    //console.log("delete key", "tlj-resv/prepayment"+ key);

    try {
        const dbRef = firebaseRef(database, "tlj-resv/prepayment" + key);
        await remove(dbRef); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isPrepayPopup.value = false;

    selectData();
}

function openResvPopup(item) {
    //console.log("* item:", item);
    let key = 0;
    let product = "";
    let amount = 0;
    let qty = 1;

    if (item == null) {
        isResvAdd.value = true;
        if (tljResv.value.reservation) {
            const reservationKeys = Object.keys(tljResv.value.reservation).map(Number); // 문자열이 아닌 숫자로 변환
            // 0부터 순차적으로 증가하며 비어있는 값을 찾기
            while (reservationKeys.includes(key)) {
                key++;
            }
        } else {
            key = 0;
        }
    } else {
        isResvAdd.value = false;
        key = item.key;
        amount = item.amount;
        product = item.product;
        qty = item.qty;
    }
    resvKey.value = key;
    resvItem.value = { "product": product, "qty": qty, "amount": amount };

    //console.log("* resvItem:", resvItem.value);

    isResvPopup.value = true;
}

async function resvUpdate() {
    const data = {
        [resvKey.value]: {
            "product": resvItem.value.product,
            "qty": Number(resvItem.value.qty),
            "amount": Number(resvItem.value.amount)
        }
    }

    try {
        const dbRef = firebaseRef(database, "tlj-resv/reservation");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isResvPopup.value = false;

    selectData();
}

async function resvDelete(target) {
    let key = "";

    if (target != null) {
        key = "/" + resvKey.value;
    }

    //console.log("delete key", "tlj-resv/prepayment"+ key);

    try {
        const dbRef = firebaseRef(database, "tlj-resv/reservation" + key);
        await remove(dbRef); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isResvPopup.value = false;

    selectData();
}



function getToday() {
    const today = new Date();

    const year = today.getFullYear();

    // 월은 0부터 시작하므로 1을 더함, padStart로 두 자리수 맞춤
    const month = String(today.getMonth() + 1).padStart(2, '0');

    // 일도 두 자리수 맞춤
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
}


function formatDate(gb, dateStr) {
    if (gb === "-") {
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    } else {
        return dateStr.replaceAll('-', '');
    }
}

function remainApply() {
    prepayDelete();

    const key = getPrepaymentNewKey();
    const amount = summary.value.prepayment - summary.value.reservation;
    prepayKey.value = key;

    prepayItem.value.date = getToday();
    prepayItem.value.amount = amount;
    prepayUpdate();
    tab.value = "prepayment";
}

function openConfirmPopup(action) {
    confirmAction.value = action;
    isConfirmPopup.value = true;
}

function action() {
    isConfirmPopup.value = false;
    switch (confirmAction.value) {
        case 'DEL_PREPAY':
            prepayDelete();
            break;
        case 'DEL_RESV' :
            resvDelete();
            break;
        case 'REMAIN_APPLY':
            remainApply();
    }
}

watch(() => resvItem.value.qty, (newQty) => {
    const amount = tljResv.value.product[resvItem.value.product];

    if (amount > 0) {
        if (newQty > 0) {
            resvItem.value.amount = amount * newQty;
        } else {
            resvItem.value.amount = null;
        }
    }
});

watch(() => resvItem.value.product, (newProduct) => {
    const amount = tljResv.value.product[newProduct];

    if (amount > 0) {
        if (resvItem.value.qty > 0) {
            resvItem.value.amount = amount * resvItem.value.qty;
        }
    }
});

onMounted(async () => {
    selectData();
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
                <AppBarTitle />
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
                            <tr :style="item.date === '합계' ? 'background-color: #fffad4 !important;' : ''"
                                @click="item.date === '합계' ? '' : openPrepayPopup(item)">
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
                    <v-container style="text-align: center;">
                        <v-btn class="ma-1" @click="openPrepayPopup()">추가</v-btn>
                        <v-btn class="ma-1" @click="openConfirmPopup('DEL_PREPAY')">전체삭제</v-btn>
                    </v-container>
                </v-tabs-window-item>
                <v-tabs-window-item value="summary">
                    <v-container id="summaryTable" fluid class="py-2">
                        <v-row class="table-row px-2"><v-col class="sum-header table-cell">선결제금액</v-col><v-col
                                class="sum-value table-cell d-flex justify-end">{{
                                    summary.prepayment.toLocaleString() }}</v-col></v-row>
                        <v-row class="table-row px-2"><v-col class="sum-header table-cell">사용금액</v-col><v-col
                                class="sum-value table-cell d-flex justify-end">{{
                                    summary.reservation.toLocaleString() }}</v-col></v-row>
                        <v-row class="table-row px-2"><v-col class="sum-header table-cell">잔여금액</v-col><v-col
                                class="sum-value table-cell d-flex justify-end">{{
                                    (summary.prepayment - summary.reservation).toLocaleString()
                                }}</v-col></v-row>
                    </v-container>
                    <v-container style="text-align: center;">
                        <v-btn class="ma-1" @click="openConfirmPopup('REMAIN_APPLY')">잔액 선결제 반영</v-btn>
                    </v-container>

                </v-tabs-window-item>
                <v-tabs-window-item value="reservation">
                    <v-data-table id="reservationTable" :headers="resvHeaders" :items="resvTab" hide-default-footer
                        items-per-page="-1" :show-items-per-page="false">
                        <template v-slot:item="{ item, index }">
                            <tr :style="item.product === '합계' ? 'background-color: #fffad4 !important;' : ''"
                                @click="item.product === '합계' ? '' : openResvPopup(item)">
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
                    <v-container style="text-align: center;">
                        <v-btn class="ma-1" @click="openResvPopup()">추가</v-btn>
                        <v-btn class="ma-1" @click="openConfirmPopup('DEL_RESV')">전체삭제</v-btn>
                    </v-container>
                </v-tabs-window-item>
            </v-tabs-window>
        </v-main>

        <v-dialog v-model="isPrepayPopup" max-width="600px">
            <v-card>
                <v-card-title>선결제 내역 추가</v-card-title>
                <v-card-text>
                    <v-text-field label="날짜" v-model="prepayItem.date" type="date" />
                    <v-text-field label="금액" v-model="prepayItem.amount" type="number" autofocus clearable />
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="prepayUpdate()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="prepayDelete(prepayKey)" :disabled="isPrepayAdd" icon="mdi-delete"></v-btn>
                    <v-btn @click="isPrepayPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="isResvPopup" max-width="600px">
            <v-card>
                <v-card-title>예약</v-card-title>
                <v-card-text>
                    <v-combobox v-model="resvItem.product" label="제품" :items="productTab"></v-combobox>
                    <v-number-input v-model="resvItem.qty" controlVariant="default" label="수량" :min="1"
                        inset></v-number-input>
                    <v-text-field label="금액" v-model="resvItem.amount" type="number" autofocus clearable />
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="resvUpdate()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="resvDelete(resvKey)" :disabled="isResvAdd" icon="mdi-delete"></v-btn>
                    <v-btn @click="isResvPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="isConfirmPopup" max-width="600px">
            <v-card>
                <v-card-title>{{ confirmAction === 'DEL_PREPAY' ? '선행결제내역 삭제' : confirmAction === 'DEL_RESV' ? '예약상품내역 삭제' : '잔액 선결제 반영' }}</v-card-title>
                <v-card-actions> 
                    <v-btn @click="action()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="isConfirmPopup = false" icon="mdi-close-thick"></v-btn>
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

#summaryTable {
    width: 100%;
    max-width: 100%;
    padding-left: 0;
    padding-right: 0;
}

.sum-header {
    font-size: 28px;
    font-weight: bold;
    background-color: rgb(199, 221, 162);
}

.sum-value {
    font-size: 28px;
}

.table-row {
    border-bottom: 1px solid silver;
}
</style>
