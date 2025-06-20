<script setup>
import { ref, onMounted, watch } from 'vue'
import html2canvas from 'html2canvas';
import { database, ref as firebaseRef, get, update, remove } from "../config/firebase";
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';


const tljResv = ref({});
const tab = ref("");
const isSendButton = ref(true);
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

const isProductPopup = ref(false);
const isProductAdd = ref(false);
const productItem = ref({});

const isConfirmPopup = ref(false);
const confirmAction = ref("");

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


const prepayHeaders = [
    { title: '날짜', align: 'start', key: 'date', value: 'date', width: 200 },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
];

const resvHeaders = [
    { title: '제품', align: 'start', key: 'product', value: 'product' },
    { title: '수량', align: 'center', sortable: false, key: 'qty', value: 'qty' },
    { title: '금액', align: 'end', sortable: false, key: 'amount', value: 'amount' },
];

const productHeaders = [
    { title: '제품', align: 'start', key: 'product', value: 'product' },
    { title: '금액', align: 'end', sortable: false, key: 'cost', value: 'cost' },
];

async function selectData() {
    setLoadingIcon();
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

    //console.log("* tljResv:", tljResv.value);
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

        prepayTab.value.sort((a, b) => a.date.localeCompare(b.date));

        //console.log("* prepayTab:", prepayTab.value);

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
        "qty": summary.value.prepayment - summary.value.reservation,
        "product": "합계"
    });

    // 상품명 리스트
    const productKeys = Object.keys(tljResv.value.product || {});

    if (productKeys.length === 0) {
        productTab.value = [];
    } else {
        productTab.value = productKeys.map(key => {
            return { "product": key, "cost": tljResv.value.product[key] };
        });
    }

    //console.log("* Prepayment:", prepayTab.value);
    //console.log("* Reservation:", resvTab.value);
    //console.log("* Summary:", summary.value);
    //console.log("* product:", productTab.value);
    //console.log("* tljResv:", tljResv.value);

    resetIcon();

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
            const baseLength = Math.min(canvas.width, canvas.height) * 0.266;
            const iconSize = baseLength * 0.6;
            const mobileWidth = window.innerWidth;

            //console.log("mobileWith", mobileWidth, canvas.width);

            // canvas 중앙 위치 계산
            const imageX = (mobileWidth - iconSize) / 2;
            const imageY = 170;

            //console.log("imageX:", imageX, "imageY:", imageY, "iconSize:", iconSize);
            //console.log("canvas width:", canvas.width /2, "canvas height:", canvas.height /2);
            //tempImagePosition.value = `v6 // imageX: ${imageX}, imageY: ${imageY}, iconSize: ${iconSize}, canvas width: ${canvas.width}, canvas height: ${canvas.height}, window width: ${window.innerWidth}`;

            // 투명도 및 이미지 그리기
            context.globalAlpha = 0.1;
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

function openResvPopup(item, productParams) {
    //console.log("* item:", item);
    let key = 0;
    let product = "";
    let amount = 0;
    let qty = 1;

    //console.log("* productParams:", productParams, item);

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

        if (productParams != null) {
            product = productParams.product;
            amount = productParams.cost;
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

function openProductPopup(item) {
    if (item == null) {
        productItem.value = { "product": "", "cost": 0 };
        isProductAdd.value = true;
    } else {
        productItem.value = { "product": item.product, "cost": item.cost };
        isProductAdd.value = false;
    }

    isProductPopup.value = true;

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

async function productUpdate() {
    const data = { [productItem.value.product]: Number(productItem.value.cost) };

    try {
        const dbRef = firebaseRef(database, "tlj-resv/product");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isProductPopup.value = false;

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

async function productDelete(target) {
    let key = "";

    if (target != null) {
        key = "/" + target;
    }

    //console.log("delete key", "tlj-resv/prepayment"+ key);

    try {
        const dbRef = firebaseRef(database, "tlj-resv/product" + key);
        await remove(dbRef); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isProductPopup.value = false;

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

function onClickAdd() {
    switch (tab.value) {
        case 'prepayment':
            openPrepayPopup();
            break;
        case 'reservation':
            openResvPopup();
            break;
        case 'production':
            openProductPopup();
            break;
    }
}

function action() {
    isConfirmPopup.value = false;
    switch (confirmAction.value) {
        case 'DEL_PREPAY':
            prepayDelete();
            break;
        case 'DEL_RESV':
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

watch(() => tab.value, (newTab) => {
    if (newTab === 'production') {
        isSendButton.value = false;
    } else {
        isSendButton.value = true;
    }

});

onMounted(async () => {
    selectData();
});
</script>

<template>
    <v-app>
        <v-app-bar color="teal-darken-4"> <!--image="https://picsum.photos/1920/1080?random-->
            <template v-slot:image>
                <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
            </template>
            <template v-slot:append>
                <v-btn icon="mdi-send" @click="shareTableAsImage()" :disabled="!isSendButton"></v-btn>
            </template>
            <AppBarTitle :onIconClick="selectData" :refreshIcon="refreshIcon" />
        </v-app-bar>
        <v-main>
            <v-tabs v-model="tab" bg-color="#202020">
                <v-tab value="prepayment">선결제 내역</v-tab>
                <v-tab value="summary">사용내역</v-tab>
                <v-tab value="reservation">예약</v-tab>
                <v-tab value="production">제품</v-tab>

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
                            <tr :style="item.product === '합계' ? 'background-color: #fff1e0 !important;' : ''"
                                @click="item.product === '합계' ? '' : openResvPopup(item)">
                                <td>{{ item.product }}</td>
                                <td :style="{
                                    textAlign: 'center',
                                    fontSize: item.product === '합계' ? '18px' : '28px'
                                }">{{ item.product === '합계' ? '(' + item.qty.toLocaleString() + ')' :
                                    item.qty.toLocaleString() }}</td>
                                <td :style="{ textAlign: 'right' }">
                                    {{ item.amount.toLocaleString() }}
                                </td>
                            </tr>
                        </template>
                    </v-data-table>
                    <v-container style="text-align: center;">
                        <v-btn class="ma-1" @click="openConfirmPopup('DEL_RESV')">전체삭제</v-btn>
                    </v-container>
                </v-tabs-window-item>
                <v-tabs-window-item value="production">
                    <v-data-table id="productTable" :headers="productHeaders" :items="productTab" hide-default-footer
                        items-per-page="-1" :show-items-per-page="false">
                        <template v-slot:item="{ item, index }">
                            <tr>
                                <td @click="openResvPopup(null, item)">{{ item.product }}</td>
                                <td :style="{ textAlign: 'right' }" @click="openProductPopup(item)">{{
                                    item.cost.toLocaleString() }}</td>
                            </tr>
                        </template>
                    </v-data-table>
                </v-tabs-window-item>
            </v-tabs-window>
            <v-fab icon="mdi-plus" color="blue" @click="onClickAdd()" class="fixed-fab" />
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
                    <v-combobox v-model="resvItem.product" label="제품"
                        :items="productTab.map(item => item.product)"></v-combobox>
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
        <v-dialog v-model="isProductPopup" max-width="600px">
            <v-card>
                <v-card-title>제품</v-card-title>
                <v-card-text>
                    <v-text-field v-model="productItem.product" label="제품" :readonly="!isProductAdd"
                        :autofocus="isProductAdd"></v-text-field>
                    <v-text-field label="금액" v-model="productItem.cost" type="number" :autofocus="!isProductAdd"
                        clearable />
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="productUpdate()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="productDelete(productItem.product)" :disabled="isProductAdd"
                        icon="mdi-delete"></v-btn>
                    <v-btn @click="isProductPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="isConfirmPopup" max-width="600px">
            <v-card>
                <v-card-title>{{ confirmAction === 'DEL_PREPAY' ? '선행결제내역 삭제' : confirmAction === 'DEL_RESV' ?
                    '예약상품내역 삭제' : '잔액 선결제 반영' }}</v-card-title>
                <v-card-actions>
                    <v-btn @click="action()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="isConfirmPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-app>
</template>

<style scoped>
::v-deep(#prepaymentTable .v-data-table__th) {
    font-size: 28px;
    font-weight: bold;
    background-color: rgb(199, 221, 162);
}

::v-deep(#reservationTable .v-data-table__th) {
    font-size: 28px;
    font-weight: bold;
    background-color: #ddb2a2;
}

::v-deep(#productTable .v-data-table__th) {
    font-size: 28px;
    font-weight: bold;
    background-color: hsl(290, 46%, 75%);
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
    background-color: #a2b8dd;
}

.sum-value {
    font-size: 28px;
}

.table-row {
    border-bottom: 1px solid silver;
}

.fixed-fab {
    position: fixed;
    bottom: 16px;
    /* 화면 하단에서 16px 위 */
    right: 16px;
    /* 화면 우측에서 16px 왼쪽 */
    z-index: 1050;
    /* 다른 요소 위에 표시되도록 설정 */
}
</style>
