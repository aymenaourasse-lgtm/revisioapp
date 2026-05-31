"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [demoTab, setDemoTab] = useState<"chat" | "quiz" | "fiche" | "flashcard">("chat");

  const demoContent = {
    chat: {
      messages: [
        { role: "user", content: "Explique-moi la photosynthèse simplement" },
        { role: "assistant", content: "La photosynthèse est le processus par lequel les plantes fabriquent leur nourriture grâce à la lumière du soleil.\n\n🌱 Les ingrédients :\n- Lumière solaire\n- CO₂ (dioxyde de carbone)\n- Eau (H₂O)\n\n⚡ Le résultat :\n- Glucose (sucre = énergie)\n- Oxygène (O₂) rejeté dans l'air\n\nEn résumé : lumière + CO₂ + eau → glucose + oxygène" },
      ]
    },
    quiz: {
      content: `Question 1 : Quel est le principal pigment responsable de la photosynthèse ?
A) La chlorophylle ✓
B) La mélanine
C) La kératine
D) La carotène

Question 2 : Où se déroule la photosynthèse ?
A) Dans les racines
B) Dans les feuilles ✓
C) Dans les tiges
D) Dans les fleurs`
    },
    fiche: {
      content: `FICHE DE RÉVISION : LA PHOTOSYNTHÈSE

DÉFINITION :
Processus par lequel les végétaux chlorophylliens synthétisent des matières organiques à partir de CO₂ et d'eau, grâce à l'énergie lumineuse.

POINTS CLÉS :
- Se déroule dans les chloroplastes
- Nécessite la lumière, le CO₂ et l'eau
- Produit du glucose et de l'oxygène
- Équation : 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂

MOTS CLÉS :
chlorophylle, chloroplaste, glucose, CO₂, lumière`
    },
    flashcard: {
      front: "Qu'est-ce que la photosynthèse ?",
      back: "Processus par lequel les plantes convertissent la lumière solaire, le CO₂ et l'eau en glucose et oxygène grâce à la chlorophylle."
    }
  };

  const [cardFlipped, setCardFlipped] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col" style={{fontFamily: "system-ui, sans-serif"}}>

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span className="text-white font-semibold text-sm">Révisio IA</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/pricing")} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Tarifs</button>
          <button onClick={() => router.push("/login")} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Se connecter</button>
          <button onClick={() => router.push("/signup")} className="bg-blue-600 hover:bg-blue-500 text-sm px-4 py-2 rounded-lg transition-colors">Commencer gratuitement</button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-6 py-20 text-center gap-6">
        <span className="bg-blue-900 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-800">✨ Propulsé par GPT-4.1</span>
        <h2 className="text-5xl font-bold leading-tight max-w-2xl">
          Révise plus vite avec{" "}
          <span className="text-blue-400">l'intelligence artificielle</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl">
          Quiz, fiches, flashcards et résumés générés en secondes. L'assistant scolaire pour élèves et enseignants.
        </p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => router.push("/signup")} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-sm font-medium transition-colors">
            Créer un compte gratuit →
          </button>
          <button onClick={() => router.push("/pricing")} className="bg-[#1e293b] hover:bg-[#273549] px-6 py-3 rounded-xl text-sm font-medium text-gray-300 transition-colors">
            Voir les tarifs
          </button>
        </div>
        <p className="text-gray-600 text-xs">10 messages gratuits par jour — aucune carte requise</p>
      </main>

      {/* Démo interactive */}
      <section className="px-8 py-16 max-w-4xl mx-auto w-full">
        <h3 className="text-2xl font-semibold text-center mb-2">Vois Révisio IA en action</h3>
        <p className="text-gray-400 text-sm text-center mb-8">Explore les fonctionnalités ci-dessous</p>

        <div className="flex gap-2 justify-center mb-6">
          {[
            { key: "chat", label: "Chat IA" },
            { key: "quiz", label: "Quiz" },
            { key: "fiche", label: "Fiche" },
            { key: "flashcard", label: "Flashcard" },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setDemoTab(tab.key as any); setCardFlipped(false); }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${demoTab === tab.key ? "bg-blue-600 text-white" : "bg-[#1a1a2e] text-gray-400 hover:text-white"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 min-h-64">
          {demoTab === "chat" && (
            <div className="flex flex-col gap-4">
              {demoContent.chat.messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.role === "user" ? "bg-blue-600" : "bg-gray-700"}`}>
                    {m.role === "user" ? "É" : "R"}
                  </div>
                  <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-[#1a1a2e] text-gray-100 rounded-tl-sm border border-gray-800"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {demoTab === "quiz" && (
            <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{demoContent.quiz.content}</pre>
          )}

          {demoTab === "fiche" && (
            <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{demoContent.fiche.content}</pre>
          )}

          {demoTab === "flashcard" && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-400 text-xs">Clique sur la carte pour la retourner</p>
              <div onClick={() => setCardFlipped(!cardFlipped)} className="cursor-pointer w-full max-w-md bg-[#1a1a2e] border border-gray-700 hover:border-blue-600 rounded-2xl p-8 min-h-40 flex flex-col items-center justify-center gap-3 transition-colors">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{cardFlipped ? "Réponse" : "Question"}</p>
                <p className="text-base text-center font-medium leading-relaxed">
                  {cardFlipped ? demoContent.flashcard.back : demoContent.flashcard.front}
                </p>
                {!cardFlipped && <p className="text-gray-600 text-xs">Clique pour révéler</p>}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-16 max-w-4xl mx-auto w-full">
        <h3 className="text-2xl font-semibold text-center mb-8">Tout ce dont tu as besoin pour réviser</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title: "Chat IA", desc: "Pose toutes tes questions à ton assistant scolaire disponible 24h/24." },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, title: "Quiz automatiques", desc: "Génère des quiz personnalisés sur n'importe quelle matière en un clic." },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, title: "Fiches de révision", desc: "Crée des fiches résumées automatiquement à partir de tes cours." },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, title: "Flashcards interactives", desc: "Mémorise avec des cartes recto/verso et un mode QCM intégré." },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="11" y2="18"/></svg>, title: "Résumé automatique", desc: "Upload tes notes et obtiens un résumé structuré en quelques secondes." },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, title: "Analyse de photos", desc: "Envoie une photo de tes notes — l'IA l'analyse et t'explique le contenu." },
          ].map((f, i) => (
            <div key={i} className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col gap-2">
              <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center mb-1">{f.icon}</div>
              <h4 className="font-medium text-sm">{f.title}</h4>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tarifs aperçu */}
      <section className="px-8 py-16 max-w-4xl mx-auto w-full">
        <h3 className="text-2xl font-semibold text-center mb-8">Des tarifs simples et accessibles</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: "Gratuit", price: "0€", desc: "Pour découvrir", features: ["10 messages/jour", "Quiz et fiches", "Flashcards"], cta: "Commencer", pro: false },
            { title: "Élève Pro", price: "9.99€", desc: "/mois", features: ["Messages illimités", "Toutes les fonctionnalités", "Upload de fichiers", "Analyse de photos"], cta: "Passer Pro", pro: true },
            { title: "Enseignant Pro", price: "14.99€", desc: "/mois", features: ["Tout Élève Pro", "Dashboard enseignant", "Créer quiz & fiches", "Gestion des élèves"], cta: "Pour ma classe", pro: false },
          ].map((plan, i) => (
            <div key={i} className={`rounded-2xl p-6 flex flex-col gap-4 border ${plan.pro ? "bg-blue-600 border-blue-500" : "bg-[#111827] border-gray-800"}`}>
              <div>
                <p className="font-semibold">{plan.title}</p>
                <p className="text-2xl font-bold mt-1">{plan.price} <span className="text-sm font-normal opacity-70">{plan.desc}</span></p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {plan.features.map((f, j) => (
                  <li key={j} className="text-sm flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push("/signup")} className={`rounded-xl py-2.5 text-sm font-medium transition-colors mt-auto ${plan.pro ? "bg-white text-blue-600 hover:bg-gray-100" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center py-16 px-6 border-t border-gray-800">
        <h3 className="text-2xl font-semibold mb-3">Prêt à mieux réviser ?</h3>
        <p className="text-gray-400 text-sm mb-6">Rejoins des milliers d'élèves qui utilisent Révisio IA.</p>
        <button onClick={() => router.push("/signup")} className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl text-sm font-medium transition-colors">
          Commencer gratuitement →
        </button>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-600 text-xs py-6 border-t border-gray-800 flex items-center justify-center gap-6">
        <span>© 2025 Révisio IA</span>
        <button onClick={() => router.push("/pricing")} className="hover:text-gray-400 transition-colors">Tarifs</button>
        <button onClick={() => router.push("/login")} className="hover:text-gray-400 transition-colors">Connexion</button>
      </footer>
    </div>
  );
}