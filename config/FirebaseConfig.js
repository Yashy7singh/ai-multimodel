// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "aifusion-6f512.firebaseapp.com",
  projectId: "aifusion-6f512", 
  storageBucket: "aifusion-6f512.firebasestorage.app",
  messagingSenderId: "229883153979",
  appId: "1:229883153979:web:8cfd7a9972f4c0af6cd61e",
  measurementId: "G-W851ZN9QW0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
