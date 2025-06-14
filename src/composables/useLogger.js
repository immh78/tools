import { database, ref, get, update } from '../config/firebase';
import { useUserStore } from '../store/user';
import { useRoute } from 'vue-router';

// 로그를 저장하는 함수
export const logPageVisit = async () => {
  const route = useRoute();

  // 로그 기록 안함 설정이면 종료
  if (route.meta?.loggable === false) {
    console.log(`[LOG] ${route.path} is not loggable`);
    return;
  }

  // 1. 현재 페이지의 ID 추출
  let pageId = extractLastPathSegment(window.location.href);
  pageId = pageId === "#" ? "root" : pageId;
  console.log('Page ID:', pageId); // 디버깅용 로그

  // 2. 현재 시각
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const datetime = d.getFullYear()
    + String(d.getMonth() + 1).padStart(2, '0')
    + String(d.getDate()).padStart(2, '0')
    + String(d.getHours()).padStart(2, '0')
    + String(d.getMinutes()).padStart(2, '0')
    + String(d.getSeconds()).padStart(2, '0');

  // 3. 사용자 UID 확인 (로그인 완료까지 대기)
  const userStore = useUserStore();

  let retries = 30; // 최대 3초 대기
  while (!userStore.user && retries > 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries--;
  }

  const uid = userStore.user?.uid || 'anonymous';

  // 4. 로그 객체 생성 및 Firebase에 저장
  const logEntry = { datetime, uid };
  const logsRef = ref(database, `logs/${pageId}`);

  try {
    const snapshot = await get(logsRef);
    let existingLogs = [];
    let key = 0;

    if (snapshot.exists()) {
      existingLogs = snapshot.val();
      const logKeys = Object.keys(existingLogs).map(Number);
      while (logKeys.includes(key)) {
        key++;
      }
    }

    const inputLog = {
      [key]: logEntry
    };
    await update(logsRef, inputLog);

  } catch (error) {
    console.error('Error saving log to Firebase:', error);
  }
};

// URL에서 마지막 경로 추출
function extractLastPathSegment(url) {
  const trimmedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const parts = trimmedUrl.split('/');
  return parts[parts.length - 1];
}

// 외부에서 직접 logPageVisit 호출하도록 export
export const useLogger = async () => {
  await logPageVisit();
};
