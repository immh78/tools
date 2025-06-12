<script setup>
import { ref, onMounted } from 'vue';
import { database, ref as firebaseRef, get, set } from '../config/firebase';
import { useRouter } from 'vue-router';
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

const routes = useRouter().options.routes;
const routeList = routes.filter(r => r.meta?.restricted);

const userOptions = ref([]);
const permissionMap = ref({});
const isSnackbar = ref(false);

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

const headers = [
    { text: '페이지 경로', value: 'path' },
    { text: '설명', value: 'comment' },
    { text: '권한 사용자', value: 'users' }
];

async function loadData() {
    setLoadingIcon();
    const userSnap = await get(firebaseRef(database, 'user'));
    if (userSnap.exists()) {
        const users = userSnap.val();
        userOptions.value = Object.entries(users).map(([uid, info]) => ({
            uid,
            name: `${info.name} (${info.email})`
        }));
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
            <AppBarTitle :onIconClick="loadData" :refreshIcon="refreshIcon" />
        </v-app-bar>

        <v-main>
            <v-container>
                <span class="mt-2 mr-2"
                    style="display: flex; font-size:11px; justify-content: end; align-items: center;">
                    <v-icon size="12px">mdi-account-key</v-icon>
                    {{ new Date().toLocaleString() }}
                </span>

                <v-card class="mt-2 ml-2 mr-2" variant="flat">
                    <v-data-table :items="routeList" :headers="headers" item-value="path">
                        <template #item.users="{ item }">
                            <v-select v-model="permissionMap[item.path]" :items="userOptions" item-title="name"
                                item-value="uid" multiple chips clearable variant="outlined" density="comfortable" />
                        </template>
                    </v-data-table>

                    <v-card-actions class="justify-end">
                        <v-btn color="primary" class="ma-2" @click="savePermissions">
                            <v-icon start>mdi-content-save</v-icon>
                            저장
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-container>
        </v-main>

        <v-snackbar v-model="isSnackbar">저장 완료!</v-snackbar>
    </v-app>
</template>

