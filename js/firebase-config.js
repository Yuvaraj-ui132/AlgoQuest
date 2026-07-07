/**
 * firebase-config.js - Firebase Initialization Configuration
 * Populate this configuration with your actual Firebase project settings.
 */

const firebaseConfig = {
  apiKey: "AIzaSyDhT-_aqAPFEeboWfrI8zkDdPdeF7U5-0E",
  authDomain: "algoquest-9aab0.firebaseapp.com",
  projectId: "algoquest-9aab0",
  storageBucket: "algoquest-9aab0.firebasestorage.app",
  messagingSenderId: "125768785017",
  appId: "1:125768785017:web:8611af918012955c5908a8"
};

let db = null;
let auth = null;
let isFirebaseConfigured = false;

// Initialize Firebase if configuration is filled out
if (
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID"
) {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    isFirebaseConfigured = true;
    console.log("Firebase successfully initialized.");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.warn("Firebase config has not been configured. Running in Guest (Local Storage) mode only.");
}
