<script setup>
import { database, ref as firebaseRef, get, update } from "../config/firebase";
import { ref, onMounted } from 'vue';

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
    console.log("onMounted!!");
});
</script>

<template>
    <v-btn @click="getChapter()">데이터 오류 조회</v-btn>
    <v-btn @click="setChapter()">데이터 오류 보정</v-btn>
    <h3>{{ chapters?.length }}</h3>
</template>