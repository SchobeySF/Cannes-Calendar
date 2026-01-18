import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCNMrhGw1trs7RlSasSkUW-jmxF74NH728",
    authDomain: "cannes-house.firebaseapp.com",
    projectId: "cannes-house",
    storageBucket: "cannes-house.firebasestorage.app",
    messagingSenderId: "342668631368",
    appId: "1:342668631368:web:e3da1914a75fe52d33277d",
    measurementId: "G-WZJWRBSBY7"
};

import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
