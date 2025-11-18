// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut,
    User,
    createUserWithEmailAndPassword
} from "firebase/auth";
import { getFirestore, collection, doc, setDoc, onSnapshot, query, getDoc, updateDoc, getDocs, runTransaction } from "firebase/firestore";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0lNZKxcK9oU4xFCjAsufUdLOxZh0BB_o",
  authDomain: "dashboard-nieuwe-nostalgie.firebaseapp.com",
  projectId: "dashboard-nieuwe-nostalgie",
  storageBucket: "dashboard-nieuwe-nostalgie.firebasestorage.app",
  messagingSenderId: "205639292163",
  appId: "1:205639292163:web:c15213141af16d3f760536",
  measurementId: "G-7H66FX0M6P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
    auth,
    db,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    collection,
    doc,
    setDoc,
    onSnapshot,
    query,
    getDoc,
    updateDoc,
    getDocs,
    runTransaction
};
export type { User };