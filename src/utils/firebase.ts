import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAxtqgI507-TarutOEsvtL3R6-TZppLSN0",
  authDomain: "twkt-91ddf.firebaseapp.com",
  projectId: "twkt-91ddf",
  storageBucket: "twkt-91ddf.firebasestorage.app",
  messagingSenderId: "754554349532",
  appId: "1:754554349532:web:f51bb0a8ee53446d309119",
  measurementId: "G-FKY3MFR4P9"
};

const app = initializeApp(firebaseConfig);
export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
