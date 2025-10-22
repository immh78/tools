<script setup>
import { ref, onMounted, watch } from 'vue'
import { database, ref as firebaseRef, get, update, set } from "../config/firebase";
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

// AppBarTitle 컴포넌트에서 사용하는 아이콘
const { icon } = usePageMeta();
const defaultIcon = ref(icon.value);
const refreshIcon = ref('');
const principal = ref(0); // 원금
const interest = ref(0); // 이자
const rate = ref(0); // 이자율
const principalAfterAdjustment = ref(0); // 조정 후 원금
const interestAfterAdjustment = ref(0); // 조정 후 이자
const additionalAmount = ref(0); // 상환시 이자

function setLoadingIcon() {
    refreshIcon.value = 'mdi-refresh';
}

function resetIcon() {
    refreshIcon.value = defaultIcon.value; // 복원
}

async function selectData() {
    setLoadingIcon();
    const dbRef = firebaseRef(database, "send-interest");
    await get(dbRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                principal.value = snapshot.val().principal;
                principalAfterAdjustment.value = snapshot.val().principalAfterAdjustment;
                rate.value = snapshot.val().rate;
            }
        })
        .catch(err => {
            //console.error("Error fetching data:", err);
        });
    resetIcon();
}

async function saveInterest() {
    const dbRef = firebaseRef(database, "send-interest");
    await update(dbRef, {
        rate: rate.value
    })
        .then(() => {
            // Data saved successfully!
        })
        .catch((error) => {
            // The write failed...
            console.error("Error saving data:", error);
        });
}



watch(rate, (newRate) => {
    if (newRate) {
        if (principal.value > 0)
            interest.value = Math.round(principal.value * (rate.value / 100) / 12 / 10) * 10;
        else {
            interest.value = 0;
        }

        if (principalAfterAdjustment.value > 0) {
            interestAfterAdjustment.value = Math.round(principalAfterAdjustment.value * (rate.value / 100) / 12 / 10) * 10;
        } else {
            interestAfterAdjustment.value = 0;
        }
    } else {
        interest.value = 0;
        interestAfterAdjustment.value = 0;

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
    selectData()
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
                <v-btn icon="mdi-content-save" @click="saveInterest()"></v-btn>
            </template>
        </v-app-bar>
        <v-main>
            <v-row class="mt-4 mx-1">
                <v-col cols="6">
                    <v-text-field label="원금" v-model="principal" type="number" variant="outlined" readonly/>
                </v-col>
                <v-col cols="6">
                    <v-text-field label="원금 이자" v-model="interest" type="number" variant="outlined" readonly/>
                </v-col>
            </v-row>
            <v-row class="mx-1">
                <v-col cols="6">
                    <v-text-field label="조정후 원금" v-model="principalAfterAdjustment" type="number" variant="outlined" readonly/>
                </v-col>
                <v-col cols="6">
                    <v-text-field label="조정후 이자" v-model="interestAfterAdjustment" type="number" readonly variant="outlined"/>
                </v-col>
            </v-row>
            <v-row class="mx-1">
                <v-col cols="6">
                    <v-text-field label="이자율" v-model="rate" type="number" variant="outlined" clearable/>            
                </v-col>
                <v-col cols="6">
                </v-col>

            </v-row>
            
            

        </v-main>

    </v-app>

</template>

<style scoped></style>
