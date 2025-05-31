<script setup>
import { database, ref as firebaseRef, get, update } from "../config/firebase";
import { ref, computed, onMounted } from 'vue';
import { useLogger } from '../composables/useLogger';

useLogger();

const logTable = ref(null);
const visitorTable = ref(null);
const error = ref(null);
const tableData = ref([])
const headers = ref([
    { title: 'Page', align: 'start', key: 'page', value: 'page' },
    { title: 'Visitor', align: 'start', key: 'visitor', value: 'visitor' },
    { title: 'Count', align: 'end', key: 'count', value: 'count' },
    { title: 'Date', align: 'center', key: 'latest', value: 'latest' },
]);

const isHostView = ref(false);
const isUserInputPopup = ref(false);
const visitorId = ref("");
const visitorName = ref("");

async function getLogs() {
    const dbRef = firebaseRef(database, "logs");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                logTable.value = snapshot.val();
                //console.log("Fetched logs:", logs.value);
            } else {
                console.log("No data available");
            }
        })
        .catch(err => {
            console.error("Error fetching data:", err);
            error.value = err.message;
        });
}

async function getVisitors() {
    const dbRef = firebaseRef(database, "visitors");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                visitorTable.value = snapshot.val();
                //console.log("Fetched logs:", logs.value);
            } else {
                console.log("No data available");
            }
        })
        .catch(err => {
            console.error("Error fetching data:", err);
            error.value = err.message;
        });
}

function processLogs(logs, visitors) {
    const entries = {}

    //console.log(visitors);

    for (const page in logs) {
        logs[page].forEach(log => {
            const visitorId = log.visitorId;
            const visitor = visitors[visitorId] || {}; // visitors[visitorId]가 없으면 빈 객체로 대체

            const key = `${page}_${visitor.name || visitorId}`;

            if (!entries[key]) {
                entries[key] = {
                    page,
                    visitor: visitor.name || `${visitorId.slice(0, 6)}...`, // visitor.name이 없으면 기본값 설정
                    visitorId: visitorId,
                    count: 1,
                    latest: log.datetime,
                    isHost: visitor.isHost || false // visitor.isHost가 없으면 false로 설정
                };
            } else {
                entries[key].count++;
                if (log.datetime > entries[key].latest) {
                    entries[key].latest = log.datetime;
                }
            }
        });
    }

    const formatDate = datetime => {
        return `${datetime.slice(4, 6)}/${datetime.slice(6, 8)} ` +
            `${datetime.slice(8, 10)}:${datetime.slice(10, 12)}`
    }

    tableData.value = Object.values(entries).map(entry => ({
        page: entry.page,
        visitor: entry.visitor,
        visitorId: entry.visitorId,
        count: entry.count,
        latest: formatDate(entry.latest),
        isHost: entry.isHost
    }));

    //console.log("*** data : ", tableData);
}

const filteredTableData = computed(() => {
    return isHostView.value
        ? tableData.value
        : tableData.value.filter(item => !item.isHost);
});

function openUserInputPopup(id) {
    visitorId.value = id;
    isUserInputPopup.value = true;
}

async function inputVisitorInfo() {
    const host = visitorName.value === '문명훈' ? true : false;
    const data = {
        [visitorId.value]:
        {
            "name": visitorName.value,
            "isHost": host
        }
    }

    try {
        const dbRef = firebaseRef(database, "visitors");
        await update(dbRef, data); // 데이터를 저장
    } catch (err) {
        console.error("Error saving data:", err);
    }

    isUserInputPopup.value = false;

    dataLoding();
}

async function dataLoding() {
    await getLogs();
    await getVisitors()

    processLogs(logTable.value, visitorTable.value);
}

onMounted(async () => {
    dataLoding();
});
</script>

<template>
    <v-app>
        <v-app-bar color="teal-darken-4">
            <template v-slot:image>
                <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
            </template>
            <v-app-bar-title><v-icon>mdi-note-search-outline</v-icon> 로그 조회</v-app-bar-title>
            <v-switch v-model="isHostView" color="yellow" label="전체조회" class="v-switch-centered"></v-switch>
        </v-app-bar>
        <v-main>
            <v-data-table :headers="headers" :items="filteredTableData" class="elevation-1" no-data-text="조회중입니다."
                hide-default-footer items-per-page="-1" :show-items-per-page="false">
                <template v-slot:item.visitor="{ item }">
                    <span @click="item.visitor.endsWith('...') ? openUserInputPopup(item.visitorId) : ''">{{ item.visitor
                        }}</span>
                </template>
            </v-data-table>
        </v-main>
        <v-dialog v-model="isUserInputPopup" max-width="600px">
            <v-card>
                <v-card-title>사용자명 등록</v-card-title>
                <v-card-text>
                    <v-text-field :label="visitorId" v-model="visitorName" autofocus clearable />
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="inputVisitorInfo()" icon="mdi-check-bold"></v-btn>
                    <v-btn @click="isUserInputPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>

</template>

<style scoped>
.v-switch-centered {
    margin: auto 0;
    /* Center vertically */
}
</style>
