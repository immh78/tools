<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="6">
        <v-card class="pa-6">
          <v-file-input
            v-model="file"
            accept="image/*"
            label="프로필 이미지 업로드"
            prepend-icon="mdi-camera"
          ></v-file-input>

          <v-btn
            color="primary"
            block
            class="mt-4"
            :loading="uploading"
            @click="uploadImage"
          >
            Upload to ImageKit
          </v-btn>

          <v-img
            v-if="uploadedUrl"
            :src="uploadedUrl"
            class="mt-6"
            max-height="300"
            contain
          ></v-img>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import ImageKit from 'imagekit-javascript'

// 1️⃣ 상태 변수
const file = ref(null)
const uploading = ref(false)
const uploadedUrl = ref("")

// 2️⃣ ImageKit SDK 초기화 (publicKey만 사용 가능)
const imagekit = new ImageKit({
  publicKey: "public_ztSp7aVVdzbqRsYwLROe43CM2SQ=",
  urlEndpoint: "https://ik.imagekit.io/66nnelktc",
})

// 3️⃣ 업로드 함수
const uploadImage = async () => {
  if (!file.value) return
  uploading.value = true

  try {
    const result = await imagekit.upload({
      file: file.value, // File 객체
      fileName: file.value.name,
      folder: "/vue-test",
      useUniqueFileName: true,
    })

    uploadedUrl.value = result.url
  } catch (err) {
    console.error("Upload failed:", err)
    alert("ImageKit 업로드 실패: 콘솔 확인")
  } finally {
    uploading.value = false
  }
}
</script>
