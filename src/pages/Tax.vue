<script setup>
import { ref, onMounted } from 'vue'
import { database, ref as firebaseRef, get, update, remove } from "../config/firebase";
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

const tax = ref({});
const month = ref([]);
const payment = ref([]);
const isOpenPopup = ref(false);

const headers = [
    { title: "지역", value: "target" },
    { title: "구분", value: "category" },
    { title: "금액", value: "amount" }
]

// AppBarTitle 컴포넌트에서 사용하는 아이콘
const { icon } = usePageMeta();
const defaultIcon = ref(icon.value);
const refreshIcon = ref('');
// const year = ref(Number(getToday().slice(0, 4))); // 현재 연도로 초기화
// const taxList = ref([]);
const taxItem = ref({
    date: "",
    category: "",
    remark: "",
    amount: 0,
    key: 0
});

const carouselIndex = ref(0); // 캐러셀 인덱스

const istaxAdd = ref(false);

function setLoadingIcon() {
    refreshIcon.value = 'mdi-refresh';
}

function resetIcon() {
    refreshIcon.value = defaultIcon.value; // 복원
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

    month.value = Object.keys(tax.value.payment).sort();
    for (const month in tax.value.payment) {
        const monthPayments = tax.value.payment[month];
        const filled = tax.value.target.map(target => {
            const record = monthPayments.find(p => p.target === target);
            return record
                ? { ...record }
                : {
                    amount: null,
                    category: "미납부",
                    date: null,
                    target
                };
        });
        payment.value[month] = filled;
    }

    console.log("* tax", tax.value);
    console.log("* month", month.value);
    console.log("* payment", payment.value);
    // console.log("* taxList", taxList.value);

    resetIcon();
}

function getToday() {
    const today = new Date();

    const y = today.getFullYear();

    // 월은 0부터 시작하므로 1을 더함, padStart로 두 자리수 맞춤
    const month = String(today.getMonth() + 1).padStart(2, '0');

    // 일도 두 자리수 맞춤
    const day = String(today.getDate()).padStart(2, '0');

    return `${y}-${month}-${day}`;
}

function formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) return dateStr; // 방어적 처리
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${year}-${month}-${day}`;
}

function openTaxPopup(year, item) {

    console.log("openTaxPopup", year, item);

    if (item) {
        taxItem.value = {
            ...item,
            date: formatDate(item.date)
        };

        istaxAdd.value = false;
    } else {

        let category = "";
        let amount = 0;
        let remark = ""
        let key = 0;

        if (tax.value[year].length > 0) {
            const lastItem = tax.value[year][tax.value[year].length - 1];
            category = lastItem.category;
            amount = lastItem.amount;
            key = Math.max(...tax.value[year].map(item => Number(item.key))) + 1;

            if (category === '십일조') {
                remark = Number(getToday().slice(5, 7)) + "월";
            }
        }

        taxItem.value = {
            date: getToday(),
            category: category,
            remark: remark,
            amount: amount,
            key: key
        };

        istaxAdd.value = true;
    }
    isOpenPopup.value = true;
}

function savetax() {

    const year = Object.keys(tax.value)[carouselIndex.value];

    const data = {
        [taxItem.value.key]: {
            date: taxItem.value.date.replace(/-/g, ''), // YYYYMMDD 형식으로 변환
            category: taxItem.value.category,
            remark: taxItem.value.remark,
            amount: Number(taxItem.value.amount),
        }
    };

    // Firebase에 저장
    const dbRef = firebaseRef(database, "tax/" + year);
    update(dbRef, data)
        .then(() => {
            console.log("헌금 정보가 성공적으로 저장되었습니다.");
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


function sumtax(year) {
    return tax.value[year].reduce((sum, item) => sum + item.amount, 0);
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
        </v-app-bar>
        <v-main>
            <v-carousel v-model="carouselIndex" :continuous="false" :show-arrows="true" hide-delimiter-background
                height="801">
                <v-carousel-item v-for="(mm, i) in month" :key="i">
                    <h3 class="ml-4 mt-2">{{ mm }}</h3>

                    <v-data-table :headers="headers" :items="payment[mm]" class="elevation-1" no-data-text="조회중입니다."
                        hide-default-footer items-per-page="-1" :show-items-per-page="false">
                        <template #item.target="{ item }">
                            <v-btn @click="openTaxPopup(mm, item)">{{ item.target }}</v-btn>
                        </template>
                    </v-data-table>

                </v-carousel-item>
            </v-carousel>
        </v-main>

        <v-dialog v-model="isOpenPopup" max-width="380px">
            <v-card>
                <v-card-title>세금 납부</v-card-title>
                <v-text-field label="납부일자" v-model="taxItem.date" type="date" />
                <v-text-field v-model="taxItem.category" label="구분" clearable />
                <v-text-field v-model="taxItem.amount" label="금액" type="number" clearable />
                <v-card-actions>
                    <v-btn @click="savetax()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="deletetax(taxItem.key)" :disabled="istaxAdd" icon="mdi-delete"></v-btn>
                    <v-btn @click="isOpenPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>

</template>

<style scoped></style>
