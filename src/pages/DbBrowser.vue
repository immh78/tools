<script setup>
import { ref, onMounted, watch } from 'vue'
import { database, ref as dbRef, get } from '../config/firebase';
import { useLogger } from '../composables/useLogger';
import { AppBarTitle, usePageMeta } from '../composables/getRouteInfo';

useLogger();

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


/* 1레벨 목록 */
const level1Options = ref([])
/* 선택된 1레벨 */
const selectedLevel1 = ref(null)
/* 트리 데이터 */
const treeItems = ref([])

/* 1레벨 로드 */
async function loadLevel1() {
    const snap = await get(dbRef(database))         // root
    if (snap.exists()) {
        level1Options.value = Object.keys(snap.val()).map(k => ({
            text: k,  // v-select 표시용
            value: k, // 실제 경로
        }))
    }
}

/* 경로 → Tree 배열 변환 */
async function buildTree(path = '') {
    const snap = await get(dbRef(database, path))
    if (!snap.exists()) return []

    return Object.entries(snap.val()).map(([key, val]) => {
        const full = path ? `${path}/${key}` : key
        const isObject = typeof val === 'object' && val !== null

        return {
            id: full,
            // 👇 브랜치면 키만, 리프면 "key: value"
            label: isObject ? key : `${key}: ${val}`,
            rawValue: val,               // 필요 시 원본 값
            children: isObject ? [] : undefined,
        }
    })
}

/* 트리 동적 로딩 */
async function loadChildren(item) {
    item.children = await buildTree(item.id)
    return true
}

onMounted(loadLevel1)

watch(selectedLevel1, async val => {
    setLoadingIcon()
    if (val) treeItems.value = await buildTree(val)
    else treeItems.value = []
    resetIcon()
})
</script>

<template>
  <v-app>

    <!-- ① 레이아웃에 포함시키려면 app prop 필수 -->
    <v-app-bar
      app
      color="teal-darken-4"
      elevation="2"
    >
      <template v-slot:image>
        <v-img
          gradient="to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)"
        />
      </template>
      <AppBarTitle :refreshIcon="refreshIcon" /> 
    </v-app-bar>

    <!-- ② 모든 화면 콘텐츠는 v-main 안쪽에 -->
    <v-main>
      <v-container fluid class="py-4">
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedLevel1"
              :items="level1Options"
              label="1-Level 선택"
              item-title="text"
              item-value="value"
              clearable
            />
          </v-col>

          <v-col cols="12" md="8">
            <!-- Treeview (Labs 컴포넌트 등록 필요) -->
            <v-treeview
              :items="treeItems"
              item-title="label"
              item-key="id"
              :load-children="loadChildren"
              open-on-click
              density="compact"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>

  </v-app>
</template>
