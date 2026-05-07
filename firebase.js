import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbeZyrwDc_X0Yz1qMJhQGuUmX39YxKtlQ",
  authDomain: "l-hortet-creatiu.firebaseapp.com",
  projectId: "l-hortet-creatiu",
  storageBucket: "l-hortet-creatiu.firebasestorage.app",
  messagingSenderId: "109908245949",
  appId: "1:109908245949:web:74cb5941b9e5c77977a6d4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
