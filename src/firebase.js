import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAK4TjJi7U9NbFbZl4L7-lJz15lerQTH-w",
    authDomain: "xpg-system.firebaseapp.com",
    projectId: "xpg-system",
    storageBucket: "xpg-system.firebasestorage.app",
    messagingSenderId: "899996746809",
    appId: "1:899996746809:web:30bd0bac9c111aec8279e8",
    measurementId: "G-B15RDH6X6C",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;