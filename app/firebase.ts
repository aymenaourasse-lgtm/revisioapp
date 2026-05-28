// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAu4eB4nCN0zfkwxrcYzNBGQ92d9ZxLn7k",
  authDomain: "revisio-ia-debdb.firebaseapp.com",
  projectId: "revisio-ia-debdb",
  storageBucket: "revisio-ia-debdb.firebasestorage.app",
  messagingSenderId: "628139318163",
  appId: "1:628139318163:web:9cfd8702785d4aefc4e666",
  measurementId: "G-GRV5HM70MN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);