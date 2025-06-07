<script setup>
import { ref, onMounted, watch } from 'vue'
import { useLogger } from '../composables/useLogger';
import { database, ref as firebaseRef, get, update, remove } from "../config/firebase";
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

//useLogger();

const scoring = ref({});
const totalScore = ref(0);
const choiceList = ref([]);
const answerList = ref([]);



const isDistPopup = ref(false);

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

async function selectData() {
    setLoadingIcon();
    const dbRef = firebaseRef(database, "scoring");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                scoring.value = snapshot.val();
            }
        })
        .catch(err => {
            //console.error("Error fetching data:", err);
        });

    console.log("* scoring", scoring.value);
    scoring.value.choiceQuestion.forEach((item, index) => {
        choiceList.value[index] = item;
    });

    for (let i = 0; i < scoring.value.answerQuestion; i++) {
        answerList.value[i] = 0; // 초기화
    }

    console.log("choiceList", choiceList.value);
    console.log("answerList", answerList.value);

    //choiceList.value = new Array(scoring.value.choiceQuestion.length).fill(0);


    console.log("* choiceQuestionTotalScore", totalScore.value);
    resetIcon();
}

watch([choiceList, answerList], ([newChoice, newAnswer]) => {
    totalScore.value =
        newChoice.reduce((sum, score) => sum + score, 0) +
        newAnswer.reduce((sum, score) => sum + Number(score), 0);

    console.log("total score", totalScore.value);
}, { deep: true });

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
                <template v-slot:append>
                    <v-btn icon="mdi-cog" @click="isDistPopup = true"></v-btn>
                </template>
            </v-app-bar>
            <v-sheet class="ma-2 pa-2" color="#f4f4f4" rounded="lg">
                 <span>객관식</span>
            <v-row class="mt-2">
                <v-col v-for="(score, key) in scoring.choiceQuestion" cols="6" xs="6" sm="6" md="3" lg="3">
                    <div class="d-flex align-center">
                        <span class="mx-2">{{ key + 1 }}번</span>
                        <v-btn-toggle v-model="choiceList[key]" :mandatory=true  divided variant="outlined">
                            <v-btn color="primary" :value="score"   ><v-icon
                                    color="blue">mdi-circle-outline</v-icon></v-btn>
                            <v-btn color="primary" :value=0><v-icon color="red">mdi-close</v-icon></v-btn>
                        </v-btn-toggle>
                    </div>
                </v-col>
            </v-row>
            </v-sheet>
            <v-sheet class="ma-2 pa-2" color="#f4f4f4" rounded="lg">
                <span>주관식</span>
                <v-row class="mt-2">
                    <v-col v-for="(score, key) in answerList" cols="6">
                        <v-number-input v-model="answerList[key]" :label="(key + 1) + '번'" :min="0" :max="10" variant="outlined" />
                    </v-col>
                </v-row>
            </v-sheet>

            <v-bottom-navigation color="primary" active>총점 : {{ totalScore }}점</v-bottom-navigation>

        </v-main>

        <v-dialog v-model="isDistPopup" max-width="380px">
            <v-card>
                <v-row class="mt-2">
                    <v-col v-for="(_, key) in scoring.choiceQuestion" cols="6" xs="6" sm="6" md="3" lg="3">
                        <v-number-input v-model="scoring.choiceQuestion[key]" :label="(key + 1) + '번'" :min="0"
                            :max="10">
                        </v-number-input>
                    </v-col>
                </v-row>
                <span class="text-center">주관식</span>
                <v-number-input v-model="scoring.answerQuestion" label="주관식 문항수" :min="0" :max="10">
                </v-number-input>
                <v-card-actions>
                    <v-btn icon="mdi-check-bold"></v-btn>
                    <v-btn @click="isDistPopup = false" icon="mdi-close-thick"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>


    </v-app>

</template>

<style scoped></style>
