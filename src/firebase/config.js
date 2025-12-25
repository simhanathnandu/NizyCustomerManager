import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAV8gwlzWBVv4mH0U2WpUixHDh3oNd7A_U",
    authDomain: "nizycustomermanager.firebaseapp.com",
    projectId: "nizycustomermanager",
    storageBucket: "nizycustomermanager.firebasestorage.app",
    messagingSenderId: "731252588066",
    appId: "1:731252588066:web:c08a9d5c25eca56502547b",
    measurementId: "G-1KQ7BB2782"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
