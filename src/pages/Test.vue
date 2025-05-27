<template>
    <div>
      <v-btn @click="handleAuthClick">인증 및 시트 수정</v-btn>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const CLIENT_ID = '1025301057295-9f1gdmbs0gm5en5v87enuq1n99tvqi9b.apps.googleusercontent.com'
  const API_KEY = 'AIzaSyAjcEIdV46fa6Kw3Hdyzf3No_3cXtScRLc'
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'
  const SHEET_ID = '1z9zfiUomAKR99RLNblL4melEgFexRIGdYgbewhTIB38'
  
  const gapiLoaded = ref(false)
  
  const loadGapi = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        gapi.load('client:auth2', resolve)
      }
      document.body.appendChild(script)
    })
  }
  
  const initClient = async () => {
    await gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: [
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
      ],
      scope: SCOPES,
    })
  }
  
  const handleAuthClick = async () => {
    if (!gapiLoaded.value) {
      await loadGapi()
      await initClient()
      gapiLoaded.value = true
    }
  
    const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get()
    if (!isSignedIn) {
      await gapi.auth2.getAuthInstance().signIn()
    }
  
    await writeToSheet()
  }
  
  const writeToSheet = async () => {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: '뚜레쥬르!A4',
        valueInputOption: 'RAW',
        resource: {
          values: [['테스트']],
        },
      })
      console.log('업데이트 성공:', response)
    } catch (error) {
      console.error('시트 업데이트 실패:', error)
    }
  }
  </script>
  