"use client";

import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col items-center justify-center gap-6" style={{fontFamily: "system-ui, sans-serif"}}>
      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Abonnement activé !</h1>
        <p className="text-gray-400 text-sm">Bienvenue dans Révisio IA Pro. Tu as maintenant accès à toutes les fonctionnalités.</p>
      </div>
      <button
        onClick={() => router.push("/student")}
        className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
      >
        Commencer à réviser
      </button>
    </div>
  );
}