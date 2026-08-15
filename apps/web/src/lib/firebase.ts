import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyB983szptwq8nU_iN02Me1vw_HFfM8b1fU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "boarding-housems.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "boarding-housems",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "boarding-housems.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "647622825270",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:647622825270:web:ab2313c44d0bb061bfcf97",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-HP49061FHC"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);
