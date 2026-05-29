"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col" style={{fontFamily: "system-ui, sans-serif"}}>

      {/* ── Header ── */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span className="text-white font-semibold text-sm">Révisio IA</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/pricing")}
            className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Tarifs
          </button>
          <button
            onClick={() => router.push("/login")}
            className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Se connecter
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="bg-blue-600 hover:bg-blue-500 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Commencer gratuitement
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex flex-col items-center justify-center flex-1 px-6 py-20 text-center gap-6">
        <span className="bg-blue-900 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-800">
          Propulsé par GPT-4
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
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Créer un compte gratuit
          </button>
          <button
            onClick={() => router.push("/pricing")}
            className="bg-[#1e293b] hover:bg-[#273549] px-6 py-3 rounded-xl text-sm font-medium text-gray-300 transition-colors"
          >
            Voir les tarifs
          </button>
        </div>
      </main>

      {/* ── Fonctionnalités ── */}
      <section className="px-8 py-16 max-w-4xl mx-auto w-full">
        <h3 className="text-2xl font-semibold text-center mb-8">Tout ce dont tu as besoin pour réviser</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col gap-2">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h4 className="font-medium text-sm">Chat IA</h4>
            <p className="text-gray-400 text-sm">Pose toutes tes questions à ton assistant scolaire disponible 24h/24.</p>
          </div>
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col gap-2">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h4 className="font-medium text-sm">Quiz automatiques</h4>
            <p className="text-gray-400 text-sm">Génère des quiz personnalisés sur n'importe quelle matière en un clic.</p>
          </div>
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col gap-2">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h4 className="font-medium text-sm">Fiches de révision</h4>
            <p className="text-gray-400 text-sm">Crée des fiches résumées automatiquement à partir de tes cours.</p>
          </div>
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col gap-2">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <h4 className="font-medium text-sm">Analyse de photos</h4>
            <p className="text-gray-400 text-sm">Envoie une photo de tes notes ou d'un exercice — l'IA l'analyse pour toi.</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="text-center py-16 px-6 border-t border-gray-800">
        <h3 className="text-2xl font-semibold mb-3">Prêt à mieux réviser ?</h3>
        <p className="text-gray-400 text-sm mb-6">Rejoins des milliers d'élèves qui utilisent Révisio IA.</p>
        <button
          onClick={() => router.push("/signup")}
          className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          Commencer gratuitement
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="text-center text-gray-600 text-xs py-6 border-t border-gray-800 flex items-center justify-center gap-6">
        <span>© 2025 Révisio IA</span>
        <button onClick={() => router.push("/pricing")} className="hover:text-gray-400 transition-colors">Tarifs</button>
        <button onClick={() => router.push("/login")} className="hover:text-gray-400 transition-colors">Connexion</button>
      </footer>

    </div>
  );
}