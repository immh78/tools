<script setup>
import { ref, onMounted } from 'vue';
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';
import { database, ref as firebaseRef, get, update, set } from "../config/firebase";

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

const travelLogs = ref([]);
const isSumPopup = ref(false);
const isPopup = ref(false);
const isSaveNotice = ref(false);
const totalUnadjustedAmount = ref(0);
const selectRow = ref(0);
const popupData = ref({});

const headers = ref([
    { title: '날짜', align: 'start', key: 'date', width: 110 },
    { title: '여행지', align: 'start', key: 'destination' },
    { title: '금액', align: 'end', sortable: false, key: 'amount' },
]);

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

function onRowClick(_, ctx) {
    selectRow.value = ctx.index;
    popupData.value = { ...travelLogs.value[selectRow.value] };
    popupData.value.date = formatDate(travelLogs.value[selectRow.value].date, "-");
    isPopup.value = true;
}

function onClickAdd() {
    selectRow.value = -1;
    popupData.value = {};
    popupData.value.date = getToday();
    isPopup.value = true;
}


function onClickSave() {
    travelLogs.value.filter(row => row.isUpdated).forEach(uptRow => {
        saveData(uptRow);
    })

    selectData();
    isSaveNotice.value = true;
}

async function saveData(param) {
    const data = {
        [param.key]: {
            "amount": param.amount||0,
            "date": param.date,
            "destination": param.destination||"",
            "item": param.item||"",
            "memo": param.memo||"",
            "isSettled": param.isSettled||false
        }
    }

    try {
        const dbRef = firebaseRef(database, "travel-logs");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }
}


function confirmPopup() {
    console.log("selectRow.value", selectRow.value);

    if (selectRow.value === -1) {
        popupData.value.key = getNewKey();
        travelLogs.value.unshift({ ...popupData.value });
        travelLogs.value[0].date = formatDate(popupData.value.date, "");
        travelLogs.value[0].isUpdated = true;
    } else {
        travelLogs.value[selectRow.value] = { ...popupData.value };
        travelLogs.value[selectRow.value].date = formatDate(popupData.value.date, "");
        travelLogs.value[selectRow.value].isUpdated = true;
    }

    isPopup.value = false;
}

function getNewKey() {
    let key = 0;
    if (travelLogs.value) {
        const keys = travelLogs.value.map(log => log.key); // 문자열이 아닌 숫자로 변환
        // 0부터 순차적으로 증가하며 비어있는 값을 찾기
        while (keys.includes(key)) {
            key++;
        }
    } else {
        key = 0;
    }

    return key;
}


function getToday() {
    const today = new Date();

    const year = today.getFullYear();

    // 월은 0부터 시작하므로 1을 더함, padStart로 두 자리수 맞춤
    const month = String(today.getMonth() + 1).padStart(2, '0');

    // 일도 두 자리수 맞춤
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}


async function selectData() {
    setLoadingIcon();

    try {
        const dbRef = firebaseRef(database, "travel-logs");
        await get(dbRef)
            .then(snapshot => {
                if (snapshot.exists()) {
                    travelLogs.value = snapshot.val();

                    // Key값 컬럼 추가
                    Object.keys(travelLogs.value).forEach(key => {
                        travelLogs.value[key].key = Number(key);
                        travelLogs.value[key].isUpdated = false;
                    })


                }
            })
            .catch(err => {
                console.error("Error fetching data:", err);
            });

        /* 날짜 역순 정렬 */
        travelLogs.value.sort((a, b) => b.date.localeCompare(a.date))

    } catch (error) {
        console.error('Error fetching data:', error);
    }

    resetIcon();
}

function formatDate(yyyymmdd, kind) {
    if (kind === '.') {
        const year = yyyymmdd.slice(0, 4)
        const month = parseInt(yyyymmdd.slice(4, 6), 10)
        const day = parseInt(yyyymmdd.slice(6, 8), 10)

        return `${year}. ${month}. ${day}`
    } else if (kind === '-') {
        const year = yyyymmdd.slice(0, 4)
        const month = yyyymmdd.slice(4, 6)
        const day = yyyymmdd.slice(6, 8)

        return `${year}-${month}-${day}`
    } else {
        return `${yyyymmdd.slice(0, 4)}${yyyymmdd.slice(5, 7)}${yyyymmdd.slice(8, 10)}`
    }
}



onMounted(async () => {
    await selectData();
});
</script>

<template>
    <v-app>
        <v-app-bar color="teal-darken-4"> <!--image="https://picsum.photos/1920/1080?random-->
            <template v-slot:image>
                <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
            </template>
            <template v-slot:append>
                <!--<v-btn icon="mdi-calculator" @click="openSumPopup()"></v-btn>-->
                <v-btn icon="mdi-content-save" @click="onClickSave()"></v-btn>

            </template>
            <AppBarTitle :onIconClick="selectData" :refreshIcon="refreshIcon" />
        </v-app-bar>
        <v-main>
            <v-data-table :headers="headers" :items="travelLogs" class="elevation-1" no-data-text="조회중입니다."
                hide-default-footer items-per-page="-1" :show-items-per-page="false" @click:row="onRowClick">
                <template #item.date="{ item }">
                    <span :style="{ fontStyle: item.isUpdated ? 'italic' : '' }">{{ formatDate(item.date, ".") }}</span>
                </template>
                <template #item.destination="{ item }">
                    <span :style="{ fontStyle: item.isUpdated ? 'italic' : '' }">{{ item.destination }}</span><br>
                    <span :style="{ fontSize: '12px', color: 'grey', fontStyle: item.isUpdated ? 'italic' : '' }">{{ item.item
                        }}</span>
                </template>

                <template #item.amount="{ item }">
                    <span :style="{ color: item.isSettled ? 'black' : 'red', fontStyle: item.isUpdated ? 'italic' : '' }">{{
                        item.amount?.toLocaleString() || 0
                        }}</span>
                </template>
            </v-data-table>

            <v-fab icon="mdi-plus" color="blue" @click="onClickAdd()" class="fixed-fab" />
        </v-main>
        <v-dialog v-model="isPopup" max-width="600px">
            <v-card>
                <v-text-field label="날짜" v-model="popupData.date" type="date" />
                <v-text-field label="여행지" v-model="popupData.destination" type="text" />
                <v-text-field label="지출내역" v-model="popupData.item" type="text" />
                <v-text-field label="금액" v-model="popupData.amount" type="number" />
                <v-text-field label="비고" v-model="popupData.memo" type="text" />
                <v-checkbox label="정산여부" v-model="popupData.isSettled" />
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="confirmPopup()">확인</v-btn>
                    <v-btn @click="isPopup = false">삭제</v-btn>
                    <v-btn @click="isPopup = false">닫기</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-snackbar v-model="isSaveNotice">저장 완료!</v-snackbar>
    </v-app>
</template>

<style scoped>
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