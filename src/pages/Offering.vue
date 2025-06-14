<script setup>
import { ref, onMounted } from 'vue'
import { database, ref as firebaseRef, get, update, remove } from "../config/firebase";
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

const offering = ref({});
const isOpenPopup = ref(false);

// AppBarTitle 컴포넌트에서 사용하는 아이콘
const { icon } = usePageMeta();
const defaultIcon = ref(icon.value);
const refreshIcon = ref('');
// const year = ref(Number(getToday().slice(0, 4))); // 현재 연도로 초기화
// const offeringList = ref([]);
const offeringItem = ref({
    date: "",
    category: "",
    remark: "",
    amount: 0,
    key: 0
});

const carouselIndex = ref(0); // 캐러셀 인덱스

const isOfferingAdd = ref(false);

function setLoadingIcon() {
    refreshIcon.value = 'mdi-refresh';
}

function resetIcon() {
    refreshIcon.value = defaultIcon.value; // 복원
}

async function selectData() {
    setLoadingIcon();
    const dbRef = firebaseRef(database, "offering");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                offering.value = snapshot.val();
            }
        })
        .catch(err => {
            //console.error("Error fetching data:", err);
        });

    /* 배열에 key index입력 */
    Object.keys(offering.value).forEach(year => {
        offering.value[year].forEach((item, index) => {
            item.key = index;
        })
    })

    console.log("* offering", offering.value);
    // console.log("* offeringList", offeringList.value);

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

function openOfferingPopup(year, item) {

    console.log("openOfferingPopup", year, item);

    if (item) {
        offeringItem.value = {
            ...item,
            date: formatDate(item.date)
        };

        isOfferingAdd.value = false;
    } else {

        let category = "";
        let amount = 0;
        let remark = ""
        let key = 0;

        if (offering.value[year].length > 0) {
            const lastItem = offering.value[year][offering.value[year].length - 1];
            category = lastItem.category;
            amount = lastItem.amount;
            key = Math.max(...offering.value[year].map(item => Number(item.key))) + 1;

            if (category === '십일조') {
                remark = Number(getToday().slice(5, 7)) + "월";
            }
        }

        offeringItem.value = {
            date: getToday(),
            category: category,
            remark: remark,
            amount: amount,
            key: key
        };

        isOfferingAdd.value = true;
    }
    isOpenPopup.value = true;
}

function saveOffering() {

    const year = Object.keys(offering.value)[carouselIndex.value];

    const data = {
        [offeringItem.value.key]: {
            date: offeringItem.value.date.replace(/-/g, ''), // YYYYMMDD 형식으로 변환
            category: offeringItem.value.category,
            remark: offeringItem.value.remark,
            amount: Number(offeringItem.value.amount),
        }
    };

    // Firebase에 저장
    const dbRef = firebaseRef(database, "offering/" + year);
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

async function deleteOffering(target) {

    const year = Object.keys(offering.value)[carouselIndex.value];

    let key = "";

    if (target != null) {
        key = "/" + target;
    }

    //console.log("delete key", "tlj-resv/prepayment"+ key);

    try {
        const dbRef = firebaseRef(database, "offering/" + year + key);
        await remove(dbRef); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isOpenPopup.value = false;

    selectData();
}


function sumOffering(year) {
    return offering.value[year].reduce((sum, item) => sum + item.amount, 0);
}

onMounted(async () => {
    await selectData();
    carouselIndex.value = Object.keys(offering.value).length - 1;
});

</script>


<template>
    <v-app>
        <v-main>
            <v-app-bar color="teal-darken-4">
                <template v-slot:image>
                    <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
                </template>
                <AppBarTitle :onIconClick="selectData" :refreshIcon="refreshIcon" />
                <template v-slot:append>
                    <v-btn icon="mdi-plus-circle"
                        @click="openOfferingPopup(Object.keys(offering)[carouselIndex])"></v-btn>
                </template>
            </v-app-bar>

            <v-carousel v-model="carouselIndex" :continuous="false" :show-arrows="true" hide-delimiter-background height="801">
                <v-carousel-item v-for="(year, i) in Object.keys(offering)" :key="i">
                    <div class="carousel-content">
                        <h3 class="ml-4 mt-2">{{ year }}</h3>
                        <v-card class="mx-4" style="border: 2px solid #d0d0d0;" variant="outlined" width="200px"><span
                                class="text-h6 ml-9">{{
                                    sumOffering(year).toLocaleString() }}원</span></v-card>
                        <div class="timeline-wrapper">
                            <v-timeline side="end">
                                <v-timeline-item v-for="item in offering[year].slice().reverse()" size="small"
                                    @click="openOfferingPopup(year, item)">
                                    <span>{{ item.date.slice(0, 4) }}년 {{ Number(item.date.slice(4, 6)) }}월 {{
                                        Number(item.date.slice(6, 8)) }}일
                                    </span>
                                    <v-alert>
                                        <span>{{ item.category }}</span>
                                        <small v-if="item.remark">({{ item?.remark }})</small> 
                                        {{ item.amount.toLocaleString() }}원
                                    </v-alert>
                                </v-timeline-item>
                            </v-timeline>
                        </div>

                    </div>
                </v-carousel-item>
            </v-carousel>
        </v-main>

        <v-dialog v-model="isOpenPopup" max-width="380px">
            <v-card>
                <v-card-title>헌금 등록</v-card-title>
                <v-text-field label="날짜" v-model="offeringItem.date" type="date" />
                <v-text-field v-model="offeringItem.category" label="헌금명" clearable />
                <v-text-field v-model="offeringItem.remark" label="비고" clearable />
                <v-text-field v-model="offeringItem.amount" label="금액" type="number" clearable />
                <v-card-actions>
                    <v-btn @click="saveOffering()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="deleteOffering(offeringItem.key)" :disabled="isOfferingAdd"
                        icon="mdi-delete"></v-btn>
                    <v-btn @click="isOpenPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>

</template>

<style scoped>

.carousel-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px); /* AppBar 높이 제외 */
  overflow: hidden;
}

.timeline-wrapper {
  flex: 1;
  overflow-y: auto;
  margin-top: 12px; 
}

</style>
