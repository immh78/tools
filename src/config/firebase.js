// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set,update } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjcEIdV46fa6Kw3Hdyzf3No_3cXtScRLc",
  authDomain: "my-firebase-9450e.firebaseapp.com",
  databaseURL: "https://my-firebase-9450e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my-firebase-9450e",
  storageBucket: "my-firebase-9450e.firebasestorage.app",
  messagingSenderId: "1025301057295",
  appId: "1:1025301057295:web:18d2432b1614cc70e5387a",
  measurementId: "G-SGD1NQERQJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, get, set, update };