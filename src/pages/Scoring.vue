<script setup>
import { ref, onMounted, watch } from 'vue'
import { useLogger } from '../composables/useLogger';
import { database, ref as firebaseRef, get, update, set } from "../config/firebase";
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

    setInit();

    console.log("* choiceQuestionTotalScore", totalScore.value);
    resetIcon();
}

async function saveSetting() {

    scoring.value.choiceQuestion = scoring.value.choiceQuestion.map(Number);
    const answerData = { "answerQuestion": Number(scoring.value.answerQuestion) };

    const dbRefChoice = firebaseRef(database, "scoring/choiceQuestion");
    await set(dbRefChoice, scoring.value.choiceQuestion)
        .then(() => {
            console.log("Data updated successfully.");
        })
        .catch(err => {
            console.error("Error updating data:", err);
        });

    const dbRefAnswer = firebaseRef(database, "scoring");
    await update(dbRefAnswer, answerData)
        .then(() => {
            console.log("Data updated successfully.");
        })
        .catch(err => {
            console.error("Error updating data:", err);
        });

    selectData();
    isDistPopup.value = false;
}

function setInit() {
    scoring.value.choiceQuestion.forEach((item, index) => {
        choiceList.value[index] = item;
    });

    for (let i = 0; i < scoring.value.answerQuestion; i++) {
        answerList.value[i] = 0; // 초기화
    }
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
                    <v-btn icon="mdi-eraser" @click="setInit()"></v-btn>
                    <v-btn icon="mdi-cog" @click="isDistPopup = true"></v-btn>
                </template>
            </v-app-bar>
            <v-sheet class="ma-2 pa-2" color="#e0e0e0" rounded="lg">
                <span>객관식</span>
                <v-row class="mt-2" >
                    <v-col v-for="(score, key) in scoring.choiceQuestion" cols="2">
                        <span class="ma-0 pa-0 text-h7">{{ key + 1 }}</span><br />
                        <v-btn-toggle v-model="choiceList[key]" :mandatory=true divided >
                            <v-btn style="width: 50px; height: 50px; min-width: 50px;" color="primary"
                                :value="score" icon="mdi-circle-outline"></v-btn>
                            <v-btn style="width: 50px; height: 50px; min-width: 50px;" color="error" :value=0 icon="mdi-close"></v-btn>
                        </v-btn-toggle>

                    </v-col>
                </v-row>

            </v-sheet>
            <v-sheet v-if="scoring.answerQuestion > 0" class="ma-2 pa-2" color="#e0e0e0" rounded="lg">
                <span>주관식</span>
                <v-row class="mt-2" no-gutters>
                    <v-col v-for="(score, key) in answerList" cols="2" class="pa-3">
                        <v-number-input bg-color="white" class="custom-font-size" v-model="answerList[key]" :label="(key + 1) + '번'"
                            :min="0" :max="10" variant="outlined" />
                    </v-col>
                </v-row>
            </v-sheet>

            <v-bottom-navigation color="primary" active>
                <h1>{{ totalScore }}</h1>
            </v-bottom-navigation>
        </v-main>
        <v-dialog v-model="isDistPopup" max-width="1000px">
            <v-sheet>
                <div class="d-flex justify-space-between align-center">
                    <!-- 좌측 텍스트 -->
                    <span class="ml-4">객관식 배점</span>

                    <!-- 우측 버튼 그룹 -->
                    <div class="d-flex">
                        <v-btn icon="mdi-plus-box-outline" variant="flat"
                            @click="scoring.choiceQuestion.push(0)"></v-btn>
                        <v-btn icon="mdi-minus-box-outline" variant="flat"
                            @click="scoring.choiceQuestion.pop()"></v-btn>
                    </div>
                </div>
                <v-row class="mt-2 mx-2">
                    <v-col v-for="(_, key) in scoring.choiceQuestion" cols="2" xs="3" sm="3" md="2" lg="1">
                        <v-text-field class="centered-input" v-model="scoring.choiceQuestion[key]"
                            :label="String(key + 1) + '번'"  variant="outlined">
                        </v-text-field>
                    </v-col>
                </v-row>
                <v-divider></v-divider>
                <v-number-input class="custom-font-size mx-5 mt-4" v-model="scoring.answerQuestion" label="주관식 문항수" variant="outlined"
                    :min="0" :max="10" />

                <v-card-actions class="d-flex justify-end">
                    <v-btn icon="mdi-check-bold" @click="saveSetting()"></v-btn>
                    <v-btn icon="mdi-close-thick" @click="isDistPopup = false"></v-btn>
                </v-card-actions>
            </v-sheet>
        </v-dialog>
    </v-app>

</template>

<style scoped>
::v-deep(.custom-font-size input) {
    font-size: 20px;
}

::v-deep(.centered-input input) {
  text-align: center;
  font-size:20px;
}

</style>
