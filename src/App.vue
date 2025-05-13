<script setup>
import { ref, onMounted } from "vue";

const chapters = ref(["Day 6", "Day 7"]);

const toggleMode = ref("quiz");
const toggleChapter = ref("");
const words = ref([]);
const selectWords = ref([]);
const wordFontSize = ref(70);
const isMeaningView = ref(false);
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
    selectWords.value = words.value.filter(item => item.chapter === param);
  }

  totalCount.value = selectWords.value.length;  
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
    currentWord.value.word = "완료!";
    return;
  }

  isMeaningView.value = false;

  let index = 0;
  if (toggleMode.value == "quiz") {
      index = Math.floor(Math.random() * selectWords.value.length);
  } else {
      index = 0;
  }
  currentWord.value = selectWords.value[index];  
}

function markCorrect() {
  correctCount.value ++;
  selectWords.value = selectWords.value.filter(item => item.word !== currentWord.value.word);

  //console.log("count : ", selectWords.value.length);
  pickRandomWord();
  updateProgress();
}

function markWrong() {
  wrongCount.value ++;

  const firstElement = selectWords.value.shift(); // Remove the first element
  firstElement.wrongCount += 1;
  selectWords.value.push(firstElement);

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
                <v-icon end>mdi-head-question</v-icon>
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
        <v-row justify="center" v-if="toggleMode === 'memorize'">
          <v-col cols="auto">
            <v-btn-toggle v-model="toggleChapter" color="deep-purple-accent-3" rounded="0" group>
              <v-btn v-for="chapter in chapters" :key="chapter" :value="chapter" @click="changeChapter(chapter)">
                {{ chapter }}
              </v-btn>

            </v-btn-toggle>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="auto">
            <span id="word" :style="{fontSize: wordFontSize + 'px'}" @click="speechWord()">{{ currentWord.word }}</span>
            <span id="wrong">
              <v-icon color="red-darken-4" v-for="n in currentWord.wrongCount">mdi-close-thick</v-icon>
            </span>
          </v-col>
        </v-row>
        <v-row justify="center" v-if="isMeaningView">
          <v-col cols="auto">
            <span id="meaning">{{ currentWord.meaning }}</span>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="auto">
            <v-btn color="light-green-lighten-5" @click="isMeaningView = !isMeaningView"><v-icon>mdi-magnify</v-icon>뜯보기</v-btn>
          </v-col>
          <v-col cols="auto">
            <v-badge color="blue" :content="correctCount"><v-btn color="blue-lighten-5" @click="markCorrect()"><v-icon>mdi-check-bold</v-icon>정답</v-btn></v-badge>
          </v-col>
          <v-col cols="auto">
            <v-badge color="error" :content="wrongCount"><v-btn color="red-lighten-5" @click="markWrong()"><v-icon>mdi-close-thick</v-icon>오답</v-btn></v-badge>
          </v-col>

        </v-row>
      </v-container>

    </v-main>
    <v-progress-linear :model-value="progress" ></v-progress-linear>    
  </v-app>

</template>

<style scoped>
  #wrong {
    font-size: 8px;
  }

  #meaning {
    color: #00695C;
  }
</style>
