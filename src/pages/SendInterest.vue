<script setup>
import { ref, onMounted, watch } from 'vue'
import { database, ref as firebaseRef, get, update, set } from "../config/firebase";
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

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

const principal = 30000000; // 원금
const interest = ref(0); // 이자
const principalAfterAdjustment = 10000000; // 조정 후 원금
const interestAfterAdjustment = ref(0); // 조정 후 이자
const additionalAmount = 13040; // 상환시 이자

watch(interestAfterAdjustment, (newInterest) => {
    if (newInterest && principalAfterAdjustment && principal) {
        interest.value = (principal * newInterest ) / principalAfterAdjustment + additionalAmount;
    } else {
        interest.value = 0;
    }
});

function getMonth() {
    const today = new Date();
    const month = today.getMonth() + 1; // 월은 0부터 시작하므로 1을 더해줌
    return month < 10 ? `0${month}` : `${month}`; // 두 자리로 맞춤
}


async function onClickShare() {
   const content = `[삼성에스디에스새마을금고] 대출원금 이자납입 안내

문명훈 고객님 2025-${getMonth()}-22 납입하실 대출상환 예정금액은 ${interest.value.toLocaleString()}원 입니다.

(금고대표번호 : 02-6155-0078)
(금융지원센터 : 1599-9000)`

  console.log("공유 내용", content);

  if (navigator.share) {
    await navigator.share({
      text: content
    });
  } else {
    alert('공유 API를 지원하지 않는 브라우저입니다.');
  }
}


onMounted(async () => {
});

</script>


<template>
    <v-app>
        <v-app-bar color="teal-darken-4">
            <template v-slot:image>
                <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"></v-img>
            </template>
            <AppBarTitle :onIconClick="selectData" :refreshIcon="refreshIcon" />
            <template v-slot:append>
                <v-btn icon="mdi-share-variant" @click="onClickShare()"></v-btn>
            </template>
        </v-app-bar>
        <v-main>
            <v-row>
                <v-col>
                    <v-text-field label="원금" v-model="principal" type="number" clearable />
                </v-col>
                <v-text-field label="원금 이자" v-model="interest" type="number" clearable />
            </v-row>
            <v-row>
                <v-col>
                    <v-text-field label="조정후 원금" v-model="principalAfterAdjustment" type="number" clearable />
                </v-col>
                <v-col>
                    <v-text-field label="조정후 이자" v-model="interestAfterAdjustment" type="number" clearable />
                </v-col>
            </v-row>
            
            <v-text-field label="상환 이자" v-model="additionalAmount" type="number" clearable />            

        </v-main>

    </v-app>

</template>

<style scoped></style>
