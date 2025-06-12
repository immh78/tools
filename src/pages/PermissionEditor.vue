<script setup>
import { ref, onMounted } from 'vue';
import { database, ref as firebaseRef, get, set } from '../config/firebase';
import { useRouter } from 'vue-router';

const routes = useRouter().options.routes;
const routeList = routes.filter(r => r.meta?.restricted);

const userOptions = ref([]);
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
            <v-app-bar-title><v-icon @click="loadData()">{{ titleIcon }}</v-icon> 식권대장 점심</v-app-bar-title>
        </v-app-bar>

        <v-main>
            <v-card class="ml-2 mr-2" variant="flat">
                <v-data-table :items="routeList" :headers="headers" item-value="path" hide-default-footer
                    items-per-page="-1" :show-items-per-page="false">
                    <template #item.users="{ item }">
                        <v-select class="mt-6" v-model="permissionMap[item.path]" :items="userOptions" item-title="name"
                            item-value="uid" multiple chips clearable variant="outlined" density="comfortable" />
                        <!-- <div class="d-flex align-center" style="height: 100%;">
                            <v-select v-model="permissionMap[item.path]" :items="userOptions" item-title="name"
                                item-value="uid" multiple chips clearable variant="outlined" density="comfortable"
                                style="width: 100%;" /> -->
                        <!-- </div> -->
                    </template>
                </v-data-table>

                <v-card-actions class="justify-end">
                    <v-btn color="primary" class="ma-2" @click="savePermissions">
                        <v-icon start>mdi-content-save</v-icon>
                        저장
                    </v-btn>
                </v-card-actions>
            </v-card>

        </v-main>

        <v-snackbar v-model="isSnackbar">저장 완료!</v-snackbar>
    </v-app>
</template>
