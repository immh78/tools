<script setup>
import { ref, onMounted } from "vue";

const chapters = ref(["Day 10", "Day 11", "Day 12"]);

const toggleMode = ref("quiz");
const toggleChapter = ref("");
const words = ref([]);
const selectWords = ref([]);
const wrongWords = ref([]);
const meaningWrongWord = ref("");
const wordFontSize = ref(70);
const isMeaningView = ref(false);
const isMeaningWrongWordView = ref(false);
const currentWord = ref({});
const correctCount = ref(0);
const wrongCount = ref(0);
const progress = ref(0);
const totalCount = ref(0);


function selectingWord(param) {
  if (toggleMode.value == "quiz") {
    selectWords.value = words.value.filter(item => chapters.value.includes(item.chapter));
    toggleChapter.value = "";
  } else {
    //console.log("chapter : ", param);
    selectWords.value = words.value.filter(item => item.chapter === param);
  }

  totalCount.value = selectWords.value.length;

  //console.log("totalCount : ", totalCount.value);
}

function changeMode() {
  initValue();

  if (toggleMode.value == "quiz") {
    toggleChapter.value = "";
    selectingWord('');
    pickRandomWord();
  }
}

function changeChapter(param) {
  initValue();
  selectingWord(param);
  pickRandomWord();
}

function pickRandomWord() {
  if (selectWords.value.length === 0) {
    currentWord.value.wrongCount = 0;
    currentWord.value.word = "완료!";
    currentWord.value.meaning = "모든 단어를 외웠습니다.";
    return;
  }

  isMeaningView.value = false;

  let index = 0;
  if (toggleMode.value == "quiz") {
    index = Math.floor(Math.random() * selectWords.value.length);
  } else {
    index = 0;
  }
  //console.log("selectWords : ", selectWords.value);
  currentWord.value = { ...selectWords.value[index] };
  //console.log("currentWord : ", currentWord.value.word);  
  let tempFontSize = 70;

  if (currentWord.value.word.length > 8) {
    tempFontSize -= (currentWord.value.word.length - 7) * 10;
  }

  if (tempFontSize < 40) {
    wordFontSize.value = 40;
  } else {
    wordFontSize.value = tempFontSize;
  }

}

function markCorrect() {
  if (selectWords.value.length === 0) return;

  correctCount.value++;
  selectWords.value = selectWords.value.filter(item => item.word !== currentWord.value.word);

  if (currentWord.value.wrongCount > 0) {
    wrongWords.value = wrongWords.value.filter(item => item.word !== currentWord.value.word);
  }

  //console.log("count : ", selectWords.value.length);

  pickRandomWord();
  updateProgress();
}

function markWrong() {
  if (selectWords.value.length === 0) return;
  wrongCount.value++;

  if (toggleMode.value == "memorize") {
    const firstElement = selectWords.value.shift(); // Remove the first element
    firstElement.wrongCount += 1;
    //console.log("firstElement : ", firstElement);

    selectWords.value.push(firstElement);
  } else {
    selectWords.value.find(item => item.word === currentWord.value.word).wrongCount += 1;
  }

  if (!wrongWords.value.some(item => item.word === currentWord.value.word)) {
    wrongWords.value.push(currentWord.value);
  }


  //console.log("count : ", selectWords.value.length);

  pickRandomWord();

}

function updateProgress() {
  progress.value = Math.round(((totalCount.value - selectWords.value.length) / totalCount.value) * 100);
}


function speechWord() {
  const utterance = new SpeechSynthesisUtterance(currentWord.value.word);
  utterance.lang = 'en-US';
  speechSynthesis.speak(utterance);
  //console.log("speech : ", currentWord.value.word);
}

function initValue() {
  correctCount.value = 0;
  wrongCount.value = 0;
  currentWord.value.word = "";
  currentWord.value.meaning = "";
  currentWord.value.wrongCount = 0;
  progress.value = 0;
  isMeaningView.value = false;
  wrongWords.value = [];
  selectWords.value = [];
}

function showMeaningWrongWord(param) {
  meaningWrongWord.value = param;
  isMeaningWrongWordView.value = true;
}


onMounted(() => {
  fetch('words.json')
    .then(response => response.json())
    .then(data => {
      words.value = data.map(item => ({
        ...item,
        wrongCount: 0
      }));
      selectingWord('');
      pickRandomWord();
    });
})

</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row justify="center">
          <v-col cols="auto">
            <v-btn-toggle v-model="toggleMode" variant="outlined" color="primary" mandatory>
              <v-btn value="quiz" @click="changeMode()">
                <span>퀴즈</span>
                <v-icon end>mdi-chat-question</v-icon>
              </v-btn>
              <v-btn value="memorize" @click="changeMode()">
                <span>암기</span>
                <v-icon end>mdi-chat-alert</v-icon>
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="auto">
            <v-btn-toggle v-model="toggleChapter" color="deep-purple-accent-3" rounded="0" group
              class="multi-line-btn-toggle">
              <v-btn v-for="chapter in chapters" :key="chapter" :value="chapter"
                :readonly="toggleMode == 'quiz' ? true : false"
                :style="chapter == currentWord.chapter && toggleMode == 'quiz' ? 'text-decoration: underline' : ''"
                @click="changeChapter(chapter)">
                {{ chapter }}
              </v-btn>

            </v-btn-toggle>
          </v-col>
        </v-row>
        <v-row id="wordRow">
          <v-col cols="auto">
            <span id="word" :style="{ fontSize: wordFontSize + 'px' }" @click="speechWord()">{{ currentWord.word
            }}</span>
            <span id="wrong">
              <v-icon color="red-darken-4" v-for="n in currentWord.wrongCount">mdi-close-thick</v-icon>
            </span>
          </v-col>
        </v-row>
        <v-row id="meaningRow">
          <v-col cols="auto">
            <v-alert v-model="isMeaningView" color="success" height="40px">
              {{ currentWord.meaning }}
            </v-alert>
          </v-col>
        </v-row>
        <v-row id="buttonRow">
          <v-col cols="auto">
            <v-btn color="light-green-lighten-5" @click="isMeaningView = !isMeaningView"><v-icon
                color="green">mdi-magnify</v-icon>뜯보기</v-btn>
          </v-col>
          <v-col cols="auto">
            <v-badge color="blue" :content="correctCount"><v-btn color="blue-lighten-5" @click="markCorrect()"><v-icon
                  color="blue">mdi-check-bold</v-icon>정답</v-btn></v-badge>
          </v-col>
          <v-col cols="auto">
            <v-badge color="error" :content="wrongCount"><v-btn color="red-lighten-5" @click="markWrong()"><v-icon
                  color="red">mdi-close-thick</v-icon>오답</v-btn></v-badge>
          </v-col>
        </v-row>
        <v-row id="wrongWordRow">
          <v-col cols="auto">
            <v-chip v-for="wrongWord in wrongWords" color="red" text-color="white" class="chip-spacing" @click="showMeaningWrongWord(wrongWord.meaning)">
              {{ wrongWord.word }}
            </v-chip>
          </v-col>
        </v-row>
      </v-container>
      <v-snackbar v-model="isMeaningWrongWordView" :timeout="2000" color="primary" variant="tonal">
        {{ meaningWrongWord }}
      </v-snackbar>
    </v-main>

    <v-progress-linear :model-value="progress" color="green"></v-progress-linear>

  </v-app>

</template>

<style scoped>
#wrong {
  font-size: 8px;
}

#wordRow {
  position: absolute;
  top: 180px;
  justify-content: center;
  display: flex;
  width: 100%;
}

#buttonRow {
  position: absolute;
  top: 340px;
  justify-content: center;
  display: flex;
  width: 100%;
}

#meaningRow {
  position: absolute;
  top: 280px;
  justify-content: center;
  display: flex;
  width: 100%;
}

#wrongWordRow {
  position: absolute;
  top: 390px;
  width: 100%;
}


.multi-line-btn-toggle {
  display: flex;
  flex-wrap: wrap;
  /* 버튼이 여러 줄로 배치되도록 설정 */
  justify-content: center;
  /* 버튼을 중앙 정렬 */
  width: 100%;
  /* 버튼 토글의 너비를 100%로 설정 */
}

.chip-spacing {
  margin: 4px;
  /* 각 v-chip 간격 설정 */
}
</style>
