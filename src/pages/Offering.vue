<script setup>
import { ref, onMounted } from 'vue'
import { useLogger } from '../composables/useLogger';
import { database, ref as firebaseRef, get, update } from "../config/firebase";
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

useLogger();

const offering = ref({});

// AppBarTitle 컴포넌트에서 사용하는 아이콘
const { icon } = usePageMeta();
const defaultIcon = ref(icon.value);
const refreshIcon = ref('');
const year = ref(2025);
const offeringList = ref([]);

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

    offeringList.value = offering.value.list['2025'] || [];
    console.log("* offering", offering.value);
    console.log("* offeringList", offeringList.value);



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

onMounted(async () => {
    selectData();
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
            </v-app-bar>
            <v-number-input v-model="year" control-variant="split"></v-number-input>
            <template>
                <v-timeline>
                    <v-timeline-item v-for="(y,i) in offeringList"  size="small">
                            {{y.date}}
                        
                    </v-timeline-item>
                </v-timeline>
            </template>
        </v-main>



    </v-app>
</template>

<style scoped></style>
