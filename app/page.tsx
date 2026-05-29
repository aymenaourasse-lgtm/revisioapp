"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">

      {/* ── Header ── */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-gray-800">
        <h1 className="text-blue-400 text-xl font-bold">Révisio IA</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/login")}
            className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg"
          >
            Se connecter
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2 rounded-lg"
          >
            Commencer gratuitement
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex flex-col items-center justify-center flex-1 px-6 py-20 text-center gap-6">
        <span className="bg-blue-900 text-blue-300 text-xs px-3 py-1 rounded-full">
          Powered by GPT-4
        </span>
        <h2 className="text-5xl font-bold leading-tight max-w-2xl">
          Révise plus vite avec{" "}
          <span className="text-blue-400">l'intelligence artificielle</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl">
          Pose tes questions, génère des quiz, crée des fiches de révision et progresse à ton rythme grâce à ton assistant scolaire IA.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => router.push("/signup")}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-sm font-medium"
          >
            Créer un compte gratuit
          </button>
          <button
            onClick={() => router.push("/login")}
            className="bg-[#1e293b] hover:bg-[#273549] px-6 py-3 rounded-xl text-sm font-medium text-gray-300"
          >
            Se connecter
          </button>
        </div>
      </main>

      {/* ── Fonctionnalités ── */}
      <section className="px-8 py-16 grid grid-cols-1 gap-6 max-w-4xl mx-auto w-full">
        <h3 className="text-2xl font-semibold text-center mb-4">Tout ce dont tu as besoin pour réviser</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111827] rounded-2xl p-6 flex flex-col gap-2">
            <span className="text-2xl">💬</span>
            <h4 className="font-medium">Chat IA</h4>
            <p className="text-gray-400 text-sm">Pose toutes tes questions à ton assistant scolaire disponible 24h/24.</p>
          </div>
          <div className="bg-[#111827] rounded-2xl p-6 flex flex-col gap-2">
            <span className="text-2xl">📝</span>
            <h4 className="font-medium">Quiz automatiques</h4>
            <p className="text-gray-400 text-sm">Génère des quiz personnalisés sur n'importe quelle matière en un clic.</p>
          </div>
          <div className="bg-[#111827] rounded-2xl p-6 flex flex-col gap-2">
            <span className="text-2xl">📚</span>
            <h4 className="font-medium">Fiches de révision</h4>
            <p className="text-gray-400 text-sm">Crée des fiches résumées automatiquement à partir de tes cours.</p>
          </div>
          <div className="bg-[#111827] rounded-2xl p-6 flex flex-col gap-2">
            <span className="text-2xl">📊</span>
            <h4 className="font-medium">Suivi de progression</h4>
            <p className="text-gray-400 text-sm">Retrouve toutes tes conversations et suis ta progression dans le temps.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="text-center text-gray-600 text-xs py-6 border-t border-gray-800">
        © 2025 Révisio IA — Tous droits réservés
      </footer>

    </div>
  );
}