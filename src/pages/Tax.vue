<script setup>
import { ref, onMounted } from 'vue'
import { database, ref as firebaseRef, get, set, remove } from "../config/firebase";
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

const tax = ref({});
const month = ref([]);
const payment = ref([]);
const isOpenPopup = ref(false);
const isMonthPopup = ref(false);
const isNotice = ref(false);
const notice = ref('');
const newMonth = ref('');

const headers = [
    { title: "지역", value: "target" },
    { title: "재산세", value: "propTaxAmount" },
    { title: "주민세", value: "resTaxAmount" }
]

// AppBarTitle 컴포넌트에서 사용하는 아이콘
const { icon } = usePageMeta();
const defaultIcon = ref(icon.value);
const refreshIcon = ref('');
const taxItem = ref({});

const carouselIndex = ref(0); // 캐러셀 인덱스

function setLoadingIcon() {
    refreshIcon.value = 'mdi-refresh';
}

function resetIcon() {
    refreshIcon.value = defaultIcon.value; // 복원
}

function openAddMonth() {
    newMonth.value = getToday().slice(0, 6); // 현재 연월로 초기화
    isMonthPopup.value = true;
}

async function addMonth() {
    if (month.value.includes(newMonth.value)) {
        notice.value = `${newMonth.value}는 이미 존재합니다.`;
        isNotice.value = true; // 팝업 닫기
        return;
    }

    tax.value.payment[newMonth.value] = [];
    await selectPayment();
    carouselIndex.value = month.value.length - 1;

    console.log("* tax", tax.value);
    console.log("* month", month.value);
    console.log("* payment", payment.value);

    isMonthPopup.value = false;
}

async function selectData() {
    setLoadingIcon();
    const dbRef = firebaseRef(database, "tax");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                tax.value = snapshot.val();
            }
        })
        .catch(err => {
            console.error("Error fetching data:", err);
        });

    await selectPayment();
    resetIcon();
}

async function selectPayment() {
    month.value = Object.keys(tax.value.payment).sort();

    month.value.forEach(mm => {
        const monthData = tax.value.payment[mm];

        const rows = tax.value.target.map(target => {
            const targetEntries = monthData.filter(entry => entry.target === target);

            const resTax = targetEntries.find(e => e.category === "주민세");
            const propTax = targetEntries.find(e => e.category === "재산세");

            return {
                target,
                resTaxAmount: resTax ? resTax.amount : null,
                propTaxAmount: propTax ? propTax.amount : null
            };
        });

        payment.value[mm] = rows;
    });

    console.log("* tax", tax.value);
    console.log("* month", month.value);
    console.log("* payment", payment.value);
}

function getToday() {
    const today = new Date();

    const y = today.getFullYear();

    // 월은 0부터 시작하므로 1을 더함, padStart로 두 자리수 맞춤
    const month = String(today.getMonth() + 1).padStart(2, '0');

    // 일도 두 자리수 맞춤
    const day = String(today.getDate()).padStart(2, '0');

    return `${y}${month}${day}`;
}

function openTaxPopup(mm, item) {

    console.log("openTaxPopup", mm, item);

    taxItem.value = {
        ...item,
        month: mm
    };
    isOpenPopup.value = true;
}

function saveTax(category) {

    const idx = tax.value.payment[taxItem.value.month].findIndex(item => item.target === taxItem.value.target && item.category === (category === 'prop' ? '재산세' : '주민세'));

    console.log("idx", idx);

    if (idx >= 0) {
        tax.value.payment[taxItem.value.month].splice(idx, 1);
    }

    console.log("month", taxItem.value.month);
    console.log("tax.value.payment", tax.value.payment);
    console.log("* tax.payment(1)", tax.value.payment[taxItem.value.month]);

    if (taxItem.value[category + 'TaxAmount'] > 0) {
        const inputData = {
            target: taxItem.value.target,
            category: category === 'prop' ? '재산세' : '주민세',
            amount: Number(taxItem.value[category + 'TaxAmount']),
            date: getToday()
        };

        tax.value.payment[taxItem.value.month].push(inputData);
    }

    console.log("* tax", tax.value);
    console.log("* tax.payment", taxItem.value.month, tax.value.payment[taxItem.value.month]);

    // Firebase에 저장
    const dbRef = firebaseRef(database, "tax/payment/" + taxItem.value.month);
    set(dbRef, tax.value.payment[taxItem.value.month])
        .then(() => {
            console.log("저장되었습니다.");
            isOpenPopup.value = false;
            selectData(); // 데이터 새로고침
        })
        .catch(err => {
            console.error("Error saving data:", err);
        });
}

async function deletetax(target) {

    const year = Object.keys(tax.value)[carouselIndex.value];

    let key = "";

    if (target != null) {
        key = "/" + target;
    }

    //console.log("delete key", "tlj-resv/prepayment"+ key);

    try {
        const dbRef = firebaseRef(database, "tax/" + year + key);
        await remove(dbRef); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isOpenPopup.value = false;

    selectData();
}

onMounted(async () => {
    await selectData();
    //console.log(month.value[0]);
    carouselIndex.value = month.value.length - 1; // 최신 월로 초기화
});

</script>


<template>
    <v-app>
        <v-app-bar color="teal-darken-4">
            <template v-slot:image>
                <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
            </template>
            <AppBarTitle :onIconClick="selectData" :refreshIcon="refreshIcon" />
            <template v-slot:append>
                <v-btn icon="mdi-plus-circle" @click="openAddMonth()"></v-btn>
            </template>
        </v-app-bar>
        <v-main>
            <v-carousel v-model="carouselIndex" :continuous="false" :show-arrows="true" hide-delimiter-background
                height="801">
                <v-carousel-item v-for="(mm, i) in month" :key="i">
                    <v-container class="d-flex justify-center mb-4">
                        <v-sheet width="120px" rounded="lg" color="light-green-lighten-3">
                            <h3 class="ma-2 text-center">{{ mm }}</h3>
                        </v-sheet>
                    </v-container>
                    <v-table>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    지역
                                </th>
                                <th class="text-left">
                                    재산세
                                </th>
                                <th class="text-left">
                                    주민세
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in payment[mm]" :key="item.target">
                                <td><v-btn @click="openTaxPopup(mm, item)"
                                        :variant="item.propTaxAmount > 0 || item.resTaxAmount > 0 ? 'flat' : 'tonal'"
                                        color="primary">{{ item.target }}</v-btn></td>
                                <td v-if="item.propTaxAmount && item.propTaxAmount > 0">{{
                                    item.propTaxAmount.toLocaleString('ko-KR') }}</td>
                                <td v-else></td>
                                <td v-if="item.resTaxAmount && item.resTaxAmount > 0">{{
                                    item.resTaxAmount.toLocaleString('ko-KR') }}</td>
                                <td v-else></td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-carousel-item>
            </v-carousel>
        </v-main>

        <v-dialog v-model="isOpenPopup" max-width="500px">
            <v-card>
                <v-card-title>{{ taxItem.target }}</v-card-title>
                <tbody class="ma-4">
                    <tr>
                        <td><v-text-field v-model="taxItem.propTaxAmount" label="재산세" type="number" clearable
                                variant="outlined" />
                        </td>
                        <td class="d-flex align-center justify-center"><v-btn @click="saveTax('prop')"
                                icon="mdi-content-save" variant="text" /></td>
                    </tr>
                    <tr>
                        <td><v-text-field v-model="taxItem.resTaxAmount" label="주민세" type="number" clearable
                                variant="outlined" /></td>
                        <td class="d-flex align-center justify-center"><v-btn @click="saveTax('res')"
                                icon="mdi-content-save" variant="text" /></td>
                    </tr>
                </tbody>
                <v-card-actions>
                    <v-btn @click="isOpenPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="isMonthPopup" max-width="380px">
            <v-card>
                <v-card-title>추가 월(yyyymm)</v-card-title>
                <v-text-field class="ma-4" v-model="newMonth" label="월" type="text" clearable variant="outlined" />
                <v-card-actions>
                    <v-btn @click="addMonth()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="isMonthPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-snackbar v-model="isNotice">{{ notice }}</v-snackbar>
    </v-app>

</template>

<style scoped></style>
