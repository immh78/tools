<script setup>
import { ref, onMounted } from 'vue';
import { database, ref as firebaseRef, get, set } from '../config/firebase';
import { useRouter } from 'vue-router';

const routes = useRouter().options.routes;
const routeList = routes.filter(r => r.meta?.requiresAuth);
// 기존: restricted === true 만 필터링
// const routeList = routes.filter(r => r.meta?.restricted);

/* 사용자 목록 → (uid → 이름) 매핑도 같이 만든다 */
const userOptions = ref([])
const userNameMap = ref({})        // ← 추가
const permissionMap = ref({});
const isSnackbar = ref(false);

// AppBarTitle 컴포넌트에서 사용하는 아이콘
const titleIcon = ref('');

function setLoadingIcon() {
    titleIcon.value = 'mdi-refresh';
}

function resetIcon() {
    titleIcon.value = 'mdi-account-key'; // 복원
}

const headers = [
    { title: '페이지', value: 'path' },
    { title: '설명', value: 'comment' },
    { title: '사용자', value: 'users' }
];

// ────────────────────────────────
const dialogVisible = ref(false);   // 팝업 열림 여부
const dialogRoutePath = ref('');      // 현재 편집 중인 라우트 path
const dialogSelectedUID = ref([]); // 팝업 내 v-select 모델

/** 행의 ‘편집’ 버튼 클릭 */
function openPermissionDialog(item) {
    dialogRoutePath.value = item.path;
    dialogSelectedUID.value = [...(permissionMap.value[item.path] ?? [])];
    dialogVisible.value = true;
}

/** 팝업 저장 */
function applyDialogSelection() {
    permissionMap.value[dialogRoutePath.value] = [...dialogSelectedUID.value];
    dialogVisible.value = false;
}
// ────────────────────────────────

async function loadData() {
    setLoadingIcon();
    const userSnap = await get(firebaseRef(database, 'user'));
    if (userSnap.exists()) {
        const users = userSnap.val()
        userOptions.value = Object.entries(users).map(([uid, info]) => ({
            uid,
            name: `${info.name} (${info.email})`,
        }))
        /* 이름 매핑 채우기 */
        userNameMap.value = Object.fromEntries(
            Object.entries(users).map(([uid, info]) => [uid, info.name])
        )
    }


    for (const route of routeList) {
        const dbPath = route.path === '/' ? 'root' : route.path.slice(1);
        const permSnap = await get(firebaseRef(database, `permission/tools/${dbPath}`));
        permissionMap.value[route.path] = permSnap.exists() ? permSnap.val() : [];
    }
    resetIcon();
}

async function savePermissions() {
    for (const [path, uids] of Object.entries(permissionMap.value)) {
        const dbPath = path === '/' ? 'root' : path.slice(1);
        await set(firebaseRef(database, `permission/tools/${dbPath}`), uids);
    }
    isSnackbar.value = true;
}


function onRowClick(_, ctx) {
    openPermissionDialog(ctx.item)
}

// ────────────────────────────────

/* 선택된 uid → 첫 글자 */
function initialOf(uid) {
    const name = userNameMap.value[uid] || ''
    return name.trim().charAt(0).toUpperCase()
}



onMounted(loadData);
</script>


<template>
    <v-app>
        <v-app-bar color="teal-darken-4">
            <template v-slot:image>
                <v-img gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)" />
            </template>
            <template v-slot:append>
                <v-btn icon="mdi-content-save" @click="savePermissions()" />
            </template>
            <v-app-bar-title><v-icon @click="loadData()">{{ titleIcon }}</v-icon> 권한 설정</v-app-bar-title>
        </v-app-bar>

        <v-main>
            <v-card class="ml-2 mr-2" variant="flat">
                <v-data-table :items="routeList" :headers="headers" item-value="path" hide-default-footer
                    items-per-page="-1" hover @click:row="onRowClick">
                    <!-- ① 페이지(path) 셀 : restricted 라우트면 빨간 글씨 -->
                    <template #item.path="{ item }">
                        <span :class="{ 'restricted-route': item.meta?.restricted }">
                            {{ item.path }}
                        </span>
                    </template>

                    <!-- ② 사용자(users) 셀 : 요약 숫자만 표시 -->
                    <template #item.users="{ item }">
                        <div class="d-flex align-center flex-wrap">
                            <template v-for="uid in permissionMap[item.path]" :key="uid">
                                <v-avatar v-if="userNameMap[uid]" color="grey" size="18" class="ma-1 small-initial">
                                    {{ initialOf(uid) }}
                                </v-avatar>
                            </template>
                        </div>
                    </template>
                </v-data-table>
            </v-card>
        </v-main>
        <!-- ───────────── 권한 편집 팝업 ───────────── -->
        <v-dialog v-model="dialogVisible" max-width="600">
            <v-card>
                <v-card-title>
                    권한 설정 — {{ dialogRoutePath }}
                </v-card-title>

                <v-card-text>
                    <v-select v-model="dialogSelectedUID" :items="userOptions" item-title="name" item-value="uid"
                        multiple chips clearable variant="outlined" label="사용자 선택" density="comfortable" />
                </v-card-text>

                <v-card-actions class="justify-end">
                    <v-btn variant="text" @click="dialogVisible = false">취소</v-btn>
                    <v-btn color="primary" @click="applyDialogSelection">확인</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-snackbar v-model="isSnackbar">저장 완료!</v-snackbar>
    </v-app>
</template>

<!-- SFC 하단 또는 전역 스타일 -->
<style scoped>
.restricted-route {
    color: #f44336;
    /* Vuetify red */
    font-weight: 600;
    /* 굵게(선택) */
}

/* 'v-avatar' 내부 글자 크기 ↓ */
.small-initial {
  font-size: 12px;   /* 필요에 따라 10~14px 사이로 조절 */
  line-height: 1;    /* 세로 가운데 정렬 유지 */
}
</style>
