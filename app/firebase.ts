import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAu4eB4nCN0zfkwxrcYzNBGQ92d9ZxLn7k",
  authDomain: "revisio-ia-debdb.firebaseapp.com",
  projectId: "revisio-ia-debdb",
  storageBucket: "revisio-ia-debdb.firebasestorage.app",
  messagingSenderId: "628139318163",
  appId: "1:628139318163:web:9cfd8702785d4aefc4e666"
};

export const app = initializeApp(firebaseConfig);