<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const visitorId = ref('');
const router = useRouter();
// 허용된 visitorId 목록
const ALLOWED_IDS = [
  '0c07db1e97c10dd364d0c7c97d8ebf5e',
  '5067475d1c7a690eb128aa0806366f71',
  'bc0f8e17b63badde366f133fe707f57f',
  '91cb2a05340782fc6626678fce9f9e31'
];

// 라우트 배열에서 메인 페이지(`/`)를 제외한 라우트만 필터링
const filteredRoutes = router.options.routes.filter(route => route.path !== '/');

function navigateTo(path) {
  router.push(path);
}

const tableRef = ref(null)

function textShare() {
  const shareTable = async () => {
    try {
      const canvas = await html2canvas(tableRef.value)
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      )

      if (!blob) {
        alert('이미지로 변환 실패')
        return
      }

      const file = new File([blob], 'table.png', { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '테이블 이미지',
          text: '공유된 테이블입니다.',
          files: [file],
        })
      } else {
        alert('공유 기능을 지원하지 않는 브라우저입니다.')
      }
    } catch (error) {
      console.error('공유 중 오류 발생:', error)
    }
  }
}

// visitorId가 허용된 ID인지 여부 판단
const isAllowed = computed(() => ALLOWED_IDS.includes(visitorId.value));

onMounted(async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  visitorId.value = result.visitorId;
});
</script>

<template>
  <div>
    <!-- visitorId 일치할 때만 전체 UI 렌더링 -->
    <template v-if="isAllowed">
      <div class="main-page">
        <h1>도구 목록</h1>
        <div class="button-container">
          <v-btn v-for="route in filteredRoutes" :key="route.path" class="nav-button" @click="navigateTo(route.path)">
            {{ route.comment }}
          </v-btn>
          <v-btn @click="textShare()">공유 테스트</v-btn>
        </div>
      </div>
      <table ref="tableRef">
        <thead>
          <tr>
            <th>이름</th>
            <th>나이</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>홍길동</td>
            <td>30</td>
          </tr>
        </tbody>
      </table>
    </template>

    <!-- 그 외 visitorId만 표시 -->
    <div class="visitor-id-overlay">
      {{ visitorId }}
    </div>
  </div>
</template>

<style scoped>
.main-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

.button-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.nav-button {
  width: 300px;
  font-size: 16px;
}

.visitor-id-overlay {
  position: fixed;
  bottom: 5px;
  right: 10px;
  font-size: 9px;
  color: #888;
  z-index: 999;
}

table {
  border-collapse: collapse;
  width: 100%;
}
th, td {
  border: 1px solid #999;
  padding: 8px;
  text-align: center;
}
</style>
