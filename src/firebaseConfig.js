// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // <-- import RTDB

const firebaseConfig = {
  apiKey: "AIzaSyAwjaEqN9tCa4ufOosQibc48Eyvjdogf8c",
  authDomain: "educational-games-b81e6.firebaseapp.com",
  databaseURL: "https://educational-games-b81e6-default-rtdb.asia-southeast1.firebasedatabase.app", // important
  projectId: "educational-games-b81e6",
  storageBucket: "educational-games-b81e6.appspot.com",
  messagingSenderId: "930174888414",
  appId: "1:930174888414:web:d9ade7d5ffc4996610554f"
};

const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);

// Firestore
export const firestoreDb = getFirestore(app);

// Storage
export const storage = getStorage(app);

// Realtime Database
export const db = getDatabase(app); // <-- export RTDB for BrainUp lobbies
