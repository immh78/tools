<script setup>
import { ref, onMounted } from 'vue';
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';
import { database, ref as firebaseRef, get, update, remove } from "../config/firebase";
import html2canvas from 'html2canvas';

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
const notSettledAmount = ref(0);
const selectRow = ref(0);
const popupData = ref({});

const headers = ref([
    { title: '날짜', align: 'start', key: 'date', width: 110 },
    { title: '여행지', align: 'start', key: 'destination' },
    { title: '금액', align: 'end', sortable: false, key: 'amount' },
]);

function openSumPopup() {

    // adjust가 "N"인 amount의 합계 계산
    const total = travelLogs.value
        .filter(row => !row.isSettled)
        .reduce((sum, row) => {
            return sum + row.amount;
        }, 0);

    // 숫자를 127,400원 형식으로 포맷팅
    notSettledAmount.value = new Intl.NumberFormat('ko-KR').format(total) + '원';
    isSumPopup.value = true;
}

function onRowClick(_, ctx) {
    selectRow.value = ctx.index;
    popupData.value = { ...travelLogs.value[selectRow.value] };
    popupData.value.date = formatDate(travelLogs.value[selectRow.value].date, "-");
    isPopup.value = true;
}

function onClickAdd() {
    console.log("popupData.value", popupData.value);

    selectRow.value = -1;
    popupData.value = {};
    popupData.value.date = getToday();
    popupData.value.destination = travelLogs.value[0].destination;
    
    isPopup.value = true;
}

async function saveData(param) {
    const data = {
        [param.key]: {
            "amount": param.amount || 0,
            "date": param.date,
            "destination": param.destination || "",
            "item": param.item || "",
            "memo": param.memo || "",
            "isSettled": param.isSettled || false
        }
    }

    try {
        const dbRef = firebaseRef(database, "travel-logs");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

async function deleteData() {
    //console.log("delete", selectRow.value, travelLogs.value[selectRow.value].key)
    try {
        const dbRef = firebaseRef(database, `travel-logs/${travelLogs.value[selectRow.value].key}`);
        await remove(dbRef); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    await selectData();
    isPopup.value = false;
}

function confirmPopup() {
    let row = selectRow.value;

    if (row === -1) {
        row = 0;
        popupData.value.key = getNewKey();
        travelLogs.value.unshift({ ...popupData.value });
    } else {
        travelLogs.value[row] = { ...popupData.value };
    }
    travelLogs.value[row].amount = Number(popupData.value.amount);
    travelLogs.value[row].date = formatDate(popupData.value.date, "");

    saveData(travelLogs.value[row]);
    //console.log("travelLogs.value[row]", travelLogs.value[row]);
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
        travelLogs.value = [];
        await get(dbRef)
            .then(snapshot => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    // Key값 컬럼 추가
                    Object.keys(data).forEach(key => {
                        //console.log("key", key);
                        travelLogs.value.push({...data[key], 'key': Number(key)});                        
                    })
                }
            })
            .catch(err => {
                console.error("Error fetching data:", err);
            });

        /* 날짜 역순 정렬 */
        travelLogs.value.sort((a, b) => b.date.localeCompare(a.date))

        //console.log("travelLogs.value", travelLogs.value)

    } catch (error) {
        console.error('Error fetching data:', error);
    }

    resetIcon();
}

async function onClickShare() {
    const tableElement = document.getElementById("shareContent");

    if (!tableElement) {
        console.error('Table element not found');
        return;
    }

    const canvas = await html2canvas(tableElement);
    const context = canvas.getContext('2d');

    const image = canvas.toDataURL('image/png');

    if (navigator.share) {
        await navigator.share({
            title: '미정산 내역',
            text: '아래 이미지를 확인하세요.',
            files: [new File([await (await fetch(image)).blob()], 'table.png', { type: 'image/png' })],
        });
    } else {
        alert('공유 API를 지원하지 않는 브라우저입니다.');
    }

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
                <v-btn icon="mdi-calculator" @click="openSumPopup()"></v-btn>
            </template>
            <AppBarTitle :onIconClick="selectData" :refreshIcon="refreshIcon" />
        </v-app-bar>
        <v-main>
            <v-data-table :headers="headers" :items="travelLogs" class="elevation-1" no-data-text="조회중입니다."
                hide-default-footer items-per-page="-1" :show-items-per-page="false" @click:row="onRowClick">
                <template #item.date="{ item }">
                    <span>{{ formatDate(item.date, ".") }}</span>
                </template>
                <template #item.destination="{ item }">
                    <span>{{ item.destination }}</span> <v-icon size="14px" color="grey-darken-1" v-if="item.memo">mdi-note-text-outline</v-icon><br>
                    <span :style="{ fontSize: '12px', color: 'grey' }">{{ item.item }}</span>
                </template>

                <template #item.amount="{ item }">
                    <span :style="{ color: item.isSettled ? 'black' : 'red' }">{{
                        item.amount?.toLocaleString() || 0
                        }}</span>
                </template>
            </v-data-table>

            <v-fab icon="mdi-plus" color="blue" @click="onClickAdd()" class="fixed-fab" />
        </v-main>
        <v-dialog v-model="isPopup" max-width="600px">
            <v-card class="pa-4">
                <v-text-field label="날짜" v-model="popupData.date" type="date" />
                <v-text-field label="여행지" v-model="popupData.destination" type="text" clearable/>
                <v-text-field label="지출내역" v-model="popupData.item" type="text" clearable/>
                <v-text-field label="금액" v-model="popupData.amount" type="number" clearable/>
                <v-text-field label="비고" v-model="popupData.memo" type="text" clearable/>
                <v-checkbox label="정산여부" v-model="popupData.isSettled" />
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="confirmPopup()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="deleteData()" :disabled="selectRow === -1" icon="mdi-delete"></v-btn>
                    <v-btn @click="isPopup = false" icon="mdi-close-thick"></v-btn>

                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="isSumPopup" max-width="600px">
            <v-card>
                <div id="shareContent">
                    <v-card-title class="d-flex justify-space-between align-center">
                        미정산 금액
                        <v-btn icon="mdi-share-variant" variant="flat" @click="onClickShare()"></v-btn>
                    </v-card-title>
                    <v-container>
                        <div v-for="(value, key) in travelLogs.filter(row => !row.isSettled)">
                            <v-row style="font-size: 14px;">
                                <v-col cols="4">
                                    <span>{{ formatDate(value.date, ".") }}</span>
                                </v-col>
                                <v-col cols="5">
                                    <span>{{ value.destination }}</span><br/>
                                    <span style="font-size: 11px; color:darkgray">{{ value.item }}</span>
                                </v-col>
                                <v-col cols="3">
                                    <span>{{ value.amount?.toLocaleString() || 0 }}</span>
                                </v-col>
                            </v-row>
                        </div>
                    </v-container>
                    <v-divider class="mx-4 border-dashed" />
                    <v-card-text class="text-end" style="font-size: 16px"> {{ notSettledAmount }}
                    </v-card-text>
                </div>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="isSumPopup = false" icon="mdi-close-thick"></v-btn>
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

.borderless-table :deep(.v-table thead th),
.borderless-table :deep(.v-table tbody td) {
    border: none !important;
    /* 각 셀의 테두리 제거 */
}

.borderless-table :deep(.v-table tbody tr:not(:last-child)) {
    border-bottom: none !important;
    /* 행 사이 구분선 제거 */
}
</style>