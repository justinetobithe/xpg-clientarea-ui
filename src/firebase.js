// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from 'firebase/storage';
import {
  getFirestore,
  doc,
  getDoc,
  // inne metody, jeśli potrzeba
} from "firebase/firestore";

const firebaseConfig = {
  // apiKey: "AIzaSyBJ_9oOOl5Sl0tRKspKn-eC83aeYTxD7U8",
  // authDomain: "xpgaming-1b02a.firebaseapp.com",
  // projectId: "xpgaming-1b02a",
  // storageBucket: "xpgaming-1b02a.firebasestorage.app",
  // messagingSenderId: "384783228974",
  // appId: "1:384783228974:web:ce8eae567b719f4a16bfbf",
  // measurementId: "G-CBQDC651KF"
  apiKey: "AIzaSyAK4TjJi7U9NbFbZl4L7-lJz15lerQTH-w",
  authDomain: "xpg-system.firebaseapp.com",
  projectId: "xpg-system",
  storageBucket: "xpg-system.firebasestorage.app",
  messagingSenderId: "899996746809",
  appId: "1:899996746809:web:30bd0bac9c111aec8279e8",
  measurementId: "G-B15RDH6X6C"
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app);


export { storage };
