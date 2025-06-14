<script setup>
import { database, ref as firebaseRef, get, update, set } from "../config/firebase";
import { ref, onMounted } from 'vue';
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

const logTable = ref(null);
const userTable = ref([]);
const error = ref(null);
const tableData = ref([])
const adminUid = ref('');
const headers = ref([
    { title: 'Page', align: 'start', key: 'page', value: 'page' },
    { title: 'User', align: 'start', key: 'user', value: 'user' },
    { title: 'Count', align: 'end', key: 'count', value: 'count' },
    { title: 'Date', align: 'center', key: 'latest', value: 'latest' },
]);

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

async function getUser() {
    const dbRef = firebaseRef(database, "user");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                userTable.value = snapshot.val();
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

function processLogs(logs, users) {
    const entries = {}

    //console.log(user);

    for (const page in logs) {
        logs[page].forEach(log => {
            const uid = log.uid;
            const user = users[uid] || {}; // user[uid]가 없으면 빈 객체로 대체

            const key = `${page}_${user.name || uid}`;

            if (!entries[key]) {
                entries[key] = {
                    page,
                    user: user.name || uid, // visitor.name이 없으면 기본값 설정
                    uid: uid,
                    count: 1,
                    latest: log.datetime
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
        user: entry.user,
        uid: entry.uid,
        count: entry.count,
        latest: formatDate(entry.latest),
        isHost: entry.isHost
    }));

    //console.log("*** data : ", tableData);
}

async function dataLoding() {
    setLoadingIcon();
    await getLogs();
    await getUser()

    processLogs(logTable.value, userTable.value);

    //console.log("userTable:", userTable.value);

    adminUid.value = Object.entries(userTable.value).find(([key, user]) => user.name === "문명훈")?.[0] || '';

    //console.log("adminUid:", adminUid.value);
    resetIcon();
}

function clearLog() {
    const filteredLogs = {};

    // 2. logs 중에서 alloweduids에 포함된 uid만 유지
    for (const page in logTable.value) {
        const pageLogs = logTable.value[page];
        const filteredPageLogs = pageLogs.filter(log => log.uid !== adminUid.value);

        if (filteredPageLogs.length > 0) {
            filteredLogs[page] = filteredPageLogs;
        }
    }

    //console.log("Filtered logs:", filteredLogs);

    
    const dbRefLogs = firebaseRef(database, "logs");
    set(dbRefLogs, filteredLogs); // 모든 로그 데이터를 삭제
 
    dataLoding();
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
            <AppBarTitle :onIconClick="dataLoding" :refreshIcon="refreshIcon" />            
            <template v-slot:append>
                <v-btn icon="mdi-broom" @click="clearLog()"></v-btn>
            </template>
        </v-app-bar>
        <v-main>
            <v-data-table :headers="headers" :items="tableData" class="elevation-1" no-data-text="조회중입니다."
                hide-default-footer items-per-page="-1" :show-items-per-page="false">
                <template v-slot:item.visitor="{ item }">
                    <span @click="item.visitor.endsWith('...') ? openUserInputPopup(item.uid) : ''">{{
                        item.visitor
                    }}</span>
                </template>
            </v-data-table>
        </v-main>
    </v-app>

</template>

<style scoped>

</style>
