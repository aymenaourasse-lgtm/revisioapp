"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin() {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Connexion réussie");
      router.push("/student");
    } catch (error) {
      alert("Erreur de connexion");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10">
      <h1 className="text-4xl font-bold mb-6">Connexion</h1>

      <input
        type="email"
        placeholder="Email"
        className="p-3 rounded text-black mb-4 w-80"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Mot de passe"
        className="p-3 rounded text-black mb-4 w-80"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className="bg-blue-600 px-6 py-3 rounded"
      >
        Se connecter
      </button>
    </main>
  );
}