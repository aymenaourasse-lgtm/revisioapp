"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp, signInWithGoogle } from "../auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firestore";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signUp(email, password);
      await setDoc(doc(db, "users", result.user.uid), {
        email,
        role,
        createdAt: new Date(),
      });
      router.push(role === "student" ? "/student" : "/teacher");
    } catch (e: any) {
      setError("Erreur lors de l'inscription. Vérifie ton email et mot de passe.");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      await setDoc(doc(db, "users", result.user.uid), {
        email: result.user.email,
        role,
        createdAt: new Date(),
      }, { merge: true });
      router.push(role === "student" ? "/student" : "/teacher");
    } catch (e: any) {
      setError("Erreur avec Google.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center" style={{fontFamily: "system-ui, sans-serif"}}>
      <div className="bg-[#111827] p-8 rounded-2xl w-full max-w-md flex flex-col gap-4 border border-gray-800">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span className="text-white font-semibold text-sm">Révisio IA</span>
        </div>

        <h1 className="text-white text-xl font-bold text-center">Crée ton compte</h1>
        <p className="text-gray-400 text-center text-sm">Commence à réviser avec l'IA</p>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => setRole("student")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
              role === "student"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-500"
            }`}
          >
            Étudiant
          </button>
          <button
            onClick={() => setRole("teacher")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
              role === "teacher"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-500"
            }`}
          >
            Enseignant
          </button>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-blue-500 transition-colors"
        />
        <input
          type="password"
          placeholder="Mot de passe (min. 6 caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSignup()}
          className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none text-white focus:border-blue-500 transition-colors"
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl py-3 text-sm font-medium transition-colors"
        >
          {loading ? "Inscription..." : "Créer mon compte"}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-xs">ou</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <button
          onClick={handleGoogle}
          className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 3.1 29.5 1 24 1 14.6 1 6.7 6.6 3.2 14.6l7 5.4C11.9 13.7 17.5 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-16.9z"/><path fill="#FBBC05" d="M10.2 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6l-7-5.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l7.7-6.2z"/><path fill="#34A853" d="M24 47c5.4 0 10-1.8 13.3-4.8l-7.4-5.7c-1.8 1.2-4.1 1.9-5.9 1.9-6.5 0-12-4.2-14-10l-7.7 6.2C6.7 41.4 14.6 47 24 47z"/></svg>
          Continuer avec Google
        </button>

        <p className="text-gray-500 text-sm text-center">
          Déjà un compte ?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Se connecter
          </a>
        </p>
        <p className="text-gray-600 text-xs text-center">
          <a href="/pricing" className="text-blue-400 hover:underline">
            Voir les forfaits
          </a>
        </p>
      </div>
    </div>
  );
}