import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCNMrhGw1trs7RlSasSkUW-jmxF74NH728",
    authDomain: "cannes-house.firebaseapp.com",
    projectId: "cannes-house",
    storageBucket: "cannes-house.firebasestorage.app",
    messagingSenderId: "342668631368",
    appId: "1:342668631368:web:e3da1914a75fe52d33277d",
    measurementId: "G-WZJWRBSBY7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
