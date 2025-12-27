import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Config from src/firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyCNMrhGw1trs7RlSasSkUW-jmxF74NH728",
    authDomain: "cannes-house.firebaseapp.com",
    projectId: "cannes-house",
    storageBucket: "cannes-house.firebasestorage.app",
    messagingSenderId: "342668631368",
    appId: "1:342668631368:web:e3da1914a75fe52d33277d",
    measurementId: "G-WZJWRBSBY7"
};

// Initialize Firebase (no analytics to avoid Node.js issues)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newUser = {
    username: 'superadmin',
    password: 'password123',
    name: 'Super Admin',
    role: 'admin',
    color: '#FFD700' // Gold
};

const createAdmin = async () => {
    console.log("Attempting to create user:", newUser.username);
    try {
        const docRef = await addDoc(collection(db, 'users'), newUser);
        console.log("Success! User created with ID: ", docRef.id);
        console.log("You can now log in with username 'superadmin' and password 'password123'");
        process.exit(0);
    } catch (e) {
        console.error("Error adding document: ", e);
        process.exit(1);
    }
}

createAdmin();
