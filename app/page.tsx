"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [demoTab, setDemoTab] = useState<"chat" | "quiz" | "fiche" | "flashcard">("chat");
  const [cardFlipped, setCardFlipped] = useState(false);

  const demoContent = {
    chat: {
      messages: [
        { role: "user", content: "Explique-moi la photosynthèse simplement" },
        { role: "assistant", content: "La photosynthèse est le processus par lequel les plantes fabriquent leur nourriture grâce à la lumière du soleil.\n\nLes ingrédients :\n- Lumière solaire\n- CO₂ (dioxyde de carbone)\n- Eau (H₂O)\n\nLe résultat :\n- Glucose (sucre = énergie)\n- Oxygène (O₂) rejeté dans l'air\n\nEn résumé : lumière + CO₂ + eau → glucose + oxygène" },
      ]
    },
    quiz: {
      questions: [
        { q: "Quel est le principal pigment responsable de la photosynthèse ?", options: ["La chlorophylle", "La mélanine", "La kératine", "La carotène"], correct: 0 },
        { q: "Où se déroule la photosynthèse ?", options: ["Dans les racines", "Dans les feuilles", "Dans les tiges", "Dans les fleurs"], correct: 1 },
      ]
    },
    fiche: {
      title: "LA PHOTOSYNTHÈSE",
      sections: [
        { label: "Définition", content: "Processus par lequel les végétaux synthétisent des matières organiques à partir de CO₂ et d'eau, grâce à l'énergie lumineuse." },
        { label: "Points clés", content: "Se déroule dans les chloroplastes · Nécessite lumière, CO₂ et eau · Produit glucose et oxygène · Équation : 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂" },
        { label: "Mots clés", content: "chlorophylle · chloroplaste · glucose · CO₂ · lumière" },
      ]
    },
    flashcard: {
      front: "Qu'est-ce que la photosynthèse ?",
      back: "Processus par lequel les plantes convertissent la lumière solaire, le CO₂ et l'eau en glucose et oxygène grâce à la chlorophylle."
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col" style={{fontFamily: "system-ui, sans-serif"}}>

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-gray-800 sticky top-0 bg-[#0f0f1a] z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span className="text-white font-semibold text-sm">Révisio IA</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/pricing")} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Tarifs</button>
          <button onClick={() => router.push("/login")} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Se connecter</button>
          <button onClick={() => router.push("/signup")} className="bg-blue-600 hover:bg-blue-500 text-sm px-4 py-2 rounded-lg transition-colors font-medium">Commencer gratuitement</button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-6 py-16 text-center gap-5">
        <span className="bg-blue-900 text-blue-300 text-xs px-3 py-1.5 rounded-full border border-blue-800 font-medium">Propulsé par GPT-4.1</span>
        <h1 className="text-5xl font-bold leading-tight max-w-2xl">
          Révise plus vite avec{" "}
          <span className="text-blue-400">l'intelligence artificielle</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl">
          Quiz, fiches, flashcards et résumés générés en secondes. L'assistant scolaire pour élèves et enseignants.
        </p>
        <div className="flex gap-3 mt-1">
          <button onClick={() => router.push("/signup")} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/40">
            Créer un compte gratuit →
          </button>
          <button onClick={() => router.push("/pricing")} className="bg-[#1e293b] hover:bg-[#273549] px-6 py-3 rounded-xl text-sm font-medium text-gray-300 transition-colors border border-gray-700">
            Voir les tarifs
          </button>
        </div>
        <p className="text-gray-600 text-xs">10 messages gratuits par jour — aucune carte requise</p>
      </main>

      {/* Stats */}
      <section className="py-8 border-y border-gray-800 bg-[#0d0d14]">
        <div className="max-w-4xl mx-auto px-8 grid grid-cols-4 gap-6 text-center">
          {[
            { number: "12 000+", label: "Élèves inscrits" },
            { number: "85 000+", label: "Quiz générés" },
            { number: "40 000+", label: "Fiches créées" },
            { number: "4.9/5", label: "Note moyenne" },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-2xl font-bold text-white">{s.number}</p>
              <p className="text-gray-500 text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Démo interactive */}
      <section className="px-8 py-16 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold mb-2">Vois Révisio IA en action</h3>
          <p className="text-gray-400 text-sm">Clique sur chaque fonctionnalité pour explorer</p>
        </div>

        <div className="flex gap-2 justify-center mb-6">
          {[
            { key: "chat", label: "Chat IA" },
            { key: "quiz", label: "Quiz" },
            { key: "fiche", label: "Fiche" },
            { key: "flashcard", label: "Flashcard" },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setDemoTab(tab.key as any); setCardFlipped(false); }}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${demoTab === tab.key ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "bg-[#1a1a2e] text-gray-400 hover:text-white border border-gray-800"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 min-h-64 shadow-2xl">
          {demoTab === "chat" && (
            <div className="flex flex-col gap-4">
              {demoContent.chat.messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.role === "user" ? "bg-blue-600" : "bg-[#1a1a2e] border border-gray-700"}`}>
                    {m.role === "user" ? "É" : (
                      <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      </div>
                    )}
                  </div>
                  <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-[#1a1a2e] text-gray-100 rounded-tl-sm border border-gray-800"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {demoTab === "quiz" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <span className="text-sm font-semibold text-blue-300">Quiz généré par IA</span>
              </div>
              {demoContent.quiz.questions.map((q, qi) => (
                <div key={qi} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-white">Question {qi + 1} : {q.q}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`px-3 py-2 rounded-xl text-sm border ${oi === q.correct ? "bg-green-900/40 border-green-700 text-green-300" : "bg-[#1a1a2e] border-gray-700 text-gray-400"}`}>
                        {String.fromCharCode(65 + oi)}) {opt} {oi === q.correct && "✓"}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {demoTab === "fiche" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <span className="text-sm font-semibold text-blue-300">Fiche de révision — {demoContent.fiche.title}</span>
              </div>
              {demoContent.fiche.sections.map((s, i) => (
                <div key={i} className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{s.content}</p>
                </div>
              ))}
            </div>
          )}

          {demoTab === "flashcard" && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
                </div>
                <span className="text-sm font-semibold text-blue-300">Flashcard interactive</span>
              </div>
              <p className="text-gray-400 text-xs">Clique sur la carte pour la retourner</p>
              <div onClick={() => setCardFlipped(!cardFlipped)} className="cursor-pointer w-full max-w-md bg-[#1a1a2e] border border-gray-700 hover:border-blue-600 rounded-2xl p-8 min-h-40 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-blue-900/20">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{cardFlipped ? "Réponse" : "Question"}</p>
                <p className="text-base text-center font-medium leading-relaxed">
                  {cardFlipped ? demoContent.flashcard.back : demoContent.flashcard.front}
                </p>
                {!cardFlipped && <p className="text-gray-600 text-xs mt-1">Clique pour révéler</p>}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-12 max-w-4xl mx-auto w-full">
        <h3 className="text-2xl font-bold text-center mb-2">Tout ce dont tu as besoin pour réviser</h3>
        <p className="text-gray-400 text-sm text-center mb-8">Des outils IA conçus pour les élèves et enseignants francophones</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title: "Chat IA", desc: "Pose toutes tes questions à ton assistant scolaire disponible 24h/24." },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, title: "Quiz automatiques", desc: "Génère des quiz personnalisés sur n'importe quelle matière en un clic." },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, title: "Fiches de révision", desc: "Crée des fiches résumées automatiquement à partir de tes cours." },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, title: "Flashcards interactives", desc: "Mémorise avec des cartes recto/verso et un mode QCM intégré." },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="11" y2="18"/></svg>, title: "Résumé automatique", desc: "Upload tes notes et obtiens un résumé structuré en quelques secondes." },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, title: "Analyse de photos", desc: "Envoie une photo de tes notes — l'IA l'analyse et t'explique le contenu." },
          ].map((f, i) => (
            <div key={i} className="bg-[#111827] border border-gray-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-blue-800 transition-colors">
              <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center mb-1">{f.icon}</div>
              <h4 className="font-semibold text-sm">{f.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pour les enseignants */}
      <section className="px-8 py-12 max-w-4xl mx-auto w-full">
        <div className="bg-gradient-to-r from-blue-900/40 to-[#111827] border border-blue-800/50 rounded-2xl p-8 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 bg-blue-900 border border-blue-700 text-blue-300 text-xs px-3 py-1 rounded-full w-fit font-medium">
            Pour les enseignants
          </div>
          <h3 className="text-2xl font-bold">Un tableau de bord dédié à votre classe</h3>
          <p className="text-gray-400 text-sm max-w-lg leading-relaxed">Créez des quiz et fiches pour vos élèves, suivez leurs progrès, gérez votre calendrier d'évaluations — tout en un seul endroit.</p>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {[
              { title: "Gestion des élèves", desc: "Suivez les progrès de chaque élève" },
              { title: "Création de contenu", desc: "Générez quiz et fiches en secondes" },
              { title: "Calendrier", desc: "Planifiez vos évaluations facilement" },
            ].map((item, i) => (
              <div key={i} className="bg-[#0f0f1a] border border-gray-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/signup")} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors w-fit mt-1">
            Créer un compte enseignant →
          </button>
        </div>
      </section>

      {/* Témoignages */}
      <section className="px-8 py-12 max-w-4xl mx-auto w-full">
        <h3 className="text-2xl font-bold text-center mb-2">Ce qu'en disent nos utilisateurs</h3>
        <p className="text-gray-400 text-sm text-center mb-8">Des élèves et enseignants qui utilisent Révisio IA au quotidien</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: "Sophie M.", role: "Terminale S", text: "J'ai gagné tellement de temps pour mes révisions. Les fiches générées sont parfaites et les quiz m'aident vraiment à mémoriser." },
            { name: "Thomas L.", role: "Étudiant en L2", text: "Révisio IA a transformé ma façon de réviser. Je génère des flashcards depuis mes cours en quelques secondes. Incroyable !" },
            { name: "Marie D.", role: "Professeure de SVT", text: "Je crée des quiz pour mes élèves en quelques minutes. Le tableau de bord enseignant est vraiment bien pensé." },
          ].map((t, i) => (
            <div key={i} className="bg-[#111827] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">"{t.text}"</p>
              <div className="mt-auto">
                <p className="text-white text-sm font-semibold">{t.name}</p>
                <p className="text-gray-500 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tarifs aperçu */}
      <section className="px-8 py-12 max-w-4xl mx-auto w-full">
        <h3 className="text-2xl font-bold text-center mb-2">Des tarifs simples et accessibles</h3>
        <p className="text-gray-400 text-sm text-center mb-8">Commence gratuitement, évolue quand tu es prêt</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: "Gratuit", price: "Gratuit", desc: "", features: ["10 messages/jour", "Quiz et fiches", "Flashcards"], cta: "Commencer", pro: fal