import { onMounted } from 'vue';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { database, ref, get, set, update } from '../config/firebase';

// 로그를 저장하는 함수
const logPageVisit = async () => {
  // 1. Visitor ID 생성
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;

  // 2. URL에서 pageId 추출
  const pathSegments = window.location.href.split('/');
  //console.log('Path:', window.location); // 디버깅용 로그

  //console.log('Path Segments:', pathSegments); // 디버깅용 로그
  const pageId = pathSegments[pathSegments.length - 1] || 'home';

  // 3. 현재 시각
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const datetime = d.getFullYear()
    + String(d.getMonth() + 1).padStart(2, '0')
    + String(d.getDate()).padStart(2, '0')
    + String(d.getHours()).padStart(2, '0')
    + String(d.getMinutes()).padStart(2, '0')
    + String(d.getSeconds()).padStart(2, '0');

  // 4. 로그 구조
  const logEntry = { datetime, visitorId };
  const logsRef = ref(database, `logs/${pageId}`);

  try {
    const snapshot = await get(logsRef);
    let existingLogs = [];

    if (snapshot.exists()) {
      existingLogs = snapshot.val();
    }

    existingLogs.push(logEntry);
    await set(logsRef, existingLogs);
  } catch (error) {
    console.error('Error saving log to Firebase:', error);
  }
};

// Composition API 훅 형태로 내보냄
export const useLogger = () => {
  onMounted(() => {
    logPageVisit();
  });
};
