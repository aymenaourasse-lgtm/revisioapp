"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white flex flex-col items-center justify-center gap-6" style={{fontFamily: "system-ui, sans-serif"}}>
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      </div>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-500">404</h1>
        <p className="text-xl font-semibold mt-2">Page introuvable</p>
        <p className="text-gray-400 text-sm mt-1">Cette page n'existe pas ou a été déplacée.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => router.back()} className="bg-gray-800 hover:bg-gray-700 px-5 py-2.5 rounded-xl text-sm transition-colors">
          Retour
        </button>
        <button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
          Accueil
        </button>
      </div>
    </div>
  );
}