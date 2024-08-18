import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCRD1_GNK0c2EyZfU4w6URcevEDR0HOEME",
  authDomain: "turfbookingwebsite.firebaseapp.com",
  projectId: "turfbookingwebsite",
  storageBucket: "turfbookingwebsite.appspot.com",
  messagingSenderId: "784880783354",
  appId: "1:784880783354:web:48a184dd8b78c120bdde43",
  measurementId: "G-TT7WFTGC5P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
