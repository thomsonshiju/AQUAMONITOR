import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCJ8QjsGeGtE4dLhUr_Wero4OIZa69NaZw",
    authDomain: "aquamonitor1.firebaseapp.com",
    projectId: "aquamonitor1",
    storageBucket: "aquamonitor1.firebasestorage.app",
    messagingSenderId: "712352272922",
    appId: "1:712352272922:web:21aa0b35f16a8a51e737a3",
    measurementId: "G-M5WTPMLKKR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Authentication and Firestore
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;