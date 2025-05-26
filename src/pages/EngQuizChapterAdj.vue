<script setup>
import { database, ref as firebaseRef, get, update } from "../config/firebase";
import { ref, onMounted } from 'vue';
import { useLogger } from '../composables/useLogger';

useLogger();

const quizChapters = ref(null);
const chapters = ref(null);
const error = ref(null);

async function fetchquizChapters() {
    const dbRef = firebaseRef(database, "eng-quiz-chapter");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                quizChapters.value = snapshot.val();
            } else {
                console.log("No data available");
            }
        })
        .catch(err => {
            console.error("Error fetching data:", err);
            error.value = err.message;
        });
}

async function getChapter() {
    await fetchquizChapters();

    //console.log(user);

    if (quizChapters.value) {
        chapters.value = [...Object.values(quizChapters.value)
            .filter(item => !item.hasOwnProperty('user'))
            .map(item => ({
                chapter: item.chapter,
                select: item.select
            }))
        ];
    }

    console.log(chapters.value);
}

async function saveQuizChapter(data) {
    try {
        const dbRef = firebaseRef(database, "eng-quiz-chapter");
        await update(dbRef, data); // 데이터를 저장
        console.log("Data saved successfully!");
    } catch (err) {
        console.error("Error saving data:", err);
    }
}


function setChapter() {

    console.log("setChapter!!");

    let user = "";
    let idx = -1;

    console.log(chapters.value);

    for (const row of chapters.value) {
        if (row.chapter.length == 2) {
            user = "GW";
        } else {
            user = "CW";
        }

        console.log(user);

        idx = Object.values(quizChapters.value).findIndex(item => item.chapter === row.chapter);

        console.log("idx :", idx);

        if (idx >= 0) {
            const saveData = { [idx]: { "chapter": row.chapter, "select": row.select, "user": user } };
            saveQuizChapter(saveData);
        }
    }
}

onMounted(async () => {
    getChapter();
});
</script>

<template>
    <div class="top-center-container">
        <h1>{{ chapters ? chapters?.length : "Loding..." }} </h1>
        <v-btn class="adjust-button" @click="setChapter()">데이터 오류 보정</v-btn>
    </div>
</template>

<style scoped>
.top-center-container {
    display: flex;
    flex-direction: column; /* 수직 정렬 */
    justify-content: flex-start; /* 상단에 배치 */
    align-items: center; /* 가로 중앙 정렬 */
    height: 100vh; /* 화면 전체 높이 */
    padding-top: 20px; /* 상단 여백 추가 (필요 시 조정) */
}

.adjust-button {
    margin-top: 50px; /* 추가적인 여백 조정 가능 */
}
</style>