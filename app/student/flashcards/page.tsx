"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firestore";
import { onAuthChange } from "../../auth";

type Flashcard = { front: string; back: string };
type FlashcardSet = { id: string; title: string; cards: Flashcard[]; createdAt: any };

export default function FlashcardsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [currentSet, setCurrentSet] = useState<FlashcardSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"home" | "review" | "qcm" | "create">("home");
  const [showGenerate, setShowGenerate] = useState(false);
  const [genSubject, setGenSubject] = useState("");
  const [genNum, setGenNum] = useState("5");
  const [generating, setGenerating] = useState(false);
  const [qcmOptions, setQcmOptions] = useState<string[]>([]);
  const [qcmAnswer, setQcmAnswer] = useState<string | null>(null);
  const [qcmCorrect, setQcmCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [manualFront, setManualFront] = useState("");
  const [manualBack, setManualBack] = useState("");
  const [manualCards, setManualCards] = useState<Flashcard[]>([]);
  const [manualTitle, setManualTitle] = useState("");

  useEffect(() => {
    const unsub = onAuthChange((user: any) => {
      if (!user) router.push("/login");
      else setUserId(user.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const q = query(collection(db, "flashcard_sets"), where("userId", "==", userId));
      const snap = await getDocs(q);
      setSets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FlashcardSet)));
    };
    load();
  }, [userId]);

  const generateQCM = (cards: Flashcard[], index: number) => {
    const correct = cards[index].back;
    const others = cards.filter((_, i) => i !== index).map((c) => c.back);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...shuffled, correct].sort(() => Math.random() - 0.5);
    setQcmOptions(options);
    setQcmAnswer(null);
    setQcmCorrect(null);
  };

  const handleGenerate = async () => {
    if (!userId) return;
    setGenerating(true);
    const res = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: genSubject, numCards: parseInt(genNum) }),
    });
    const data = await res.json();
    if (data.cards?.length > 0) {
      const title = genSubject || `Flashcards ${new Date().toLocaleDateString("fr-FR")}`;
      const docRef = await addDoc(collection(db, "flashcard_sets"), {
        userId, title, cards: data.cards, createdAt: serverTimestamp(),
      });
      const newSet: FlashcardSet = { id: docRef.id, title, cards: data.cards, createdAt: new Date() };
      setSets((prev) => [newSet, ...prev]);
      setCurrentSet(newSet);
      setCurrentIndex(0);
      setFlipped(false);
      setScore(0);
      setMode("review");
    }
    setGenerating(false);
    setShowGenerate(false);
    setGenSubject("");
  };

  const handleSaveManual = async () => {
    if (!userId || manualCards.length === 0 || !manualTitle.trim()) return;
    const docRef = await addDoc(collection(db, "flashcard_sets"), {
      userId, title: manualTitle, cards: manualCards, createdAt: serverTimestamp(),
    });
    const newSet: FlashcardSet = { id: docRef.id, title: manualTitle, cards: manualCards, createdAt: new Date() };
    setSets((prev) => [newSet, ...prev]);
    setCurrentSet(newSet);
    setCurrentIndex(0);
    setFlipped(false);
    setScore(0);
    setMode("review");
    setManualCards([]);
    setManualTitle("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce set ?")) return;
    await deleteDoc(doc(db, "flashcard_sets", id));
    setSets((prev) => prev.filter((s) => s.id !== id));
    if (currentSet?.id === id) { setCurrentSet(null); setMode("home"); }
  };

  const handleQCMAnswer = (answer: string) => {
    if (qcmAnswer) return;
    const correct = answer === currentSet!.cards[currentIndex].back;
    setQcmAnswer(answer);
    setQcmCorrect(correct);
    if (correct) setScore((s) => s + 1);
  };

  const nextCard = () => {
    const next = currentIndex + 1;
    if (next >= currentSet!.cards.length) {
      setMode("home");
      setCurrentSet(null);
      return;
    }
    setCurrentIndex(next);
    setFlipped(false);
    if (mode === "qcm") generateQCM(currentSet!.cards, next);
  };

  const startReview = (set: FlashcardSet, reviewMode: "review" | "qcm") => {
    setCurrentSet(set);
    setCurrentIndex(0);
    setFlipped(false);
    setScore(0);
    if (reviewMode === "qcm") generateQCM(set.cards, 0);
    setMode(reviewMode);
  };

  return (
    <div className="flex h-screen bg-[#0d0d14] text-white" style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0d14] border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">Révisio IA</h1>
              <p className="text-gray-500 text-xs">Flashcards</p>
            </div>
          </div>
        </div>

        <div className="p-3 flex flex-col gap-1">
          <button onClick={() => router.push("/student")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Chat IA
          </button>
          <button onClick={() => { setMode("home"); setCurrentSet(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Flashcards
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <p className="text-gray-600 text-xs px-3 py-2 uppercase tracking-wider">Mes sets</p>
          {sets.length === 0 && <p className="text-gray-600 text-xs text-center mt-4">Aucun set créé</p>}
          {sets.map((s) => (
            <div key={s.id} className="group flex items-center gap-1 rounded-lg hover:bg-gray-800">
              <button onClick={() => startReview(s, "review")} className="flex-1 text-left text-sm px-3 py-2 text-gray-400 group-hover:text-white truncate">
                {s.title} <span className="text-gray-600 text-xs">({s.cards.length})</span>
              </button>
              <button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 text-gray-600 hover:text-red-400 transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col bg-[#0f0f1a]">

        {/* Home */}
        {mode === "home" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold">Flashcards</h2>
              <p className="text-gray-500 text-sm mt-1">Révise avec des cartes générées par l'IA ou crée les tiennes</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGenerate(true)} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Générer avec l'IA
              </button>
              <button onClick={() => setMode("create")} className="bg-gray-800 hover:bg-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                Créer manuellement
              </button>
            </div>
            {sets.length > 0 && (
              <div className="w-full max-w-2xl">
                <p className="text-gray-500 text-sm mb-3">Tes sets récents</p>
                <div className="grid grid-cols-2 gap-3">
                  {sets.slice(0, 4).map((s) => (
                    <div key={s.id} className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                      <div>
                        <p className="text-sm font-medium">{s.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{s.cards.length} cartes</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startReview(s, "review")} className="flex-1 bg-blue-600 hover:bg-blue-500 rounded-lg py-1.5 text-xs font-medium transition-colors">
                          Recto/Verso
                        </button>
                        <button onClick={() => startReview(s, "qcm")} className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-lg py-1.5 text-xs font-medium transition-colors">
                          QCM
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review recto/verso */}
        {mode === "review" && currentSet && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            <div className="flex items-center justify-between w-full max-w-lg">
              <button onClick={() => { setMode("home"); setCurrentSet(null); }} className="text-gray-500 hover:text-white text-sm flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                Retour
              </button>
              <p className="text-gray-400 text-sm">{currentIndex + 1} / {currentSet.cards.length}</p>
            </div>

            <div className="w-full max-w-lg">
              <div className="w-full bg-gray-800 rounded-full h-1.5 mb-6">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / currentSet.cards.length) * 100}%` }}></div>
              </div>

              {/* Carte flip */}
              <div onClick={() => setFlipped(!flipped)} className="cursor-pointer bg-[#1a1a2e] border border-gray-700 rounded-2xl p-8 min-h-48 flex flex-col items-center justify-center gap-4 hover:border-blue-600 transition-colors">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{flipped ? "Réponse" : "Question"}</p>
                <p className="text-lg text-center font-medium leading-relaxed">
                  {flipped ? currentSet.cards[currentIndex].back : currentSet.cards[currentIndex].front}
                </p>
                {!flipped && <p className="text-gray-600 text-xs mt-2">Clique pour révéler</p>}
              </div>
            </div>

            <div className="flex gap-3">
              {currentIndex > 0 && (
                <button onClick={() => { setCurrentIndex(currentIndex - 1); setFlipped(false); }} className="bg-gray-800 hover:bg-gray-700 px-5 py-2.5 rounded-xl text-sm transition-colors">
                  ← Précédent
                </button>
              )}
              <button onClick={nextCard} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                {currentIndex + 1 >= currentSet.cards.length ? "Terminer ✓" : "Suivant →"}
              </button>
            </div>
          </div>
        )}

        {/* QCM */}
        {mode === "qcm" && currentSet && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            <div className="flex items-center justify-between w-full max-w-lg">
              <button onClick={() => { setMode("home"); setCurrentSet(null); }} className="text-gray-500 hover:text-white text-sm flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                Retour
              </button>
              <p className="text-gray-400 text-sm">Score : {score}/{currentIndex + (qcmAnswer ? 1 : 0)} — {currentIndex + 1}/{currentSet.cards.length}</p>
            </div>

            <div className="w-full max-w-lg">
              <div className="w-full bg-gray-800 rounded-full h-1.5 mb-6">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / currentSet.cards.length) * 100}%` }}></div>
              </div>

              <div className="bg-[#1a1a2e] border border-gray-700 rounded-2xl p-6 mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Question</p>
                <p className="text-lg font-medium">{currentSet.cards[currentIndex].front}</p>
              </div>

              <div className="flex flex-col gap-2">
                {qcmOptions.map((opt, i) => (
                  <button key={i} onClick={() => handleQCMAnswer(opt)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors border ${
                      qcmAnswer === null ? "border-gray-700 hover:border-blue-500 hover:bg-blue-950 bg-[#1a1a2e]"
                      : opt === currentSet.cards[currentIndex].back ? "border-green-500 bg-green-950 text-green-300"
                      : qcmAnswer === opt ? "border-red-500 bg-red-950 text-red-300"
                      : "border-gray-700 bg-[#1a1a2e] opacity-50"
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>

              {qcmAnswer && (
                <div className="mt-4 flex justify-end">
                  <button onClick={nextCard} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                    {currentIndex + 1 >= currentSet.cards.length ? "Voir résultat ✓" : "Suivant →"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Création manuelle */}
        {mode === "create" && (
          <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto">
            <div className="w-full max-w-lg flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Créer un set</h2>
                <button onClick={() => setMode("home")} className="text-gray-500 hover:text-white text-sm">Annuler</button>
              </div>
              <input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Titre du set (ex: Biologie Chap.3)"
                className="bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors" />
              <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-sm text-gray-400">Ajouter une carte</p>
                <input value={manualFront} onChange={(e) => setManualFront(e.target.value)}
                  placeholder="Recto (question)"
                  className="bg-[#0f0f1a] border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
                <input value={manualBack} onChange={(e) => setManualBack(e.target.value)}
                  placeholder="Verso (réponse)"
                  className="bg-[#0f0f1a] border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
                <button onClick={() => {
                  if (!manualFront.trim() || !manualBack.trim()) return;
                  setManualCards((prev) => [...prev, { front: manualFront.trim(), back: manualBack.trim() }]);
                  setManualFront(""); setManualBack("");
                }} className="bg-blue-600 hover:bg-blue-500 rounded-lg py-2 text-sm font-medium transition-colors">
                  + Ajouter
                </button>
              </div>
              {manualCards.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-gray-400 text-sm">{manualCards.length} carte(s)</p>
                  {manualCards.map((c, i) => (
                    <div key={i} className="bg-[#1a1a2e] border border-gray-800 rounded-lg px-4 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm">{c.front}</p>
                        <p className="text-gray-500 text-xs">{c.back}</p>
                      </div>
                      <button onClick={() => setManualCards((prev) => prev.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                  <button onClick={handleSaveManual} disabled={!manualTitle.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium transition-colors mt-2">
                    Sauvegarder le set
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal génération IA */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Générer des flashcards</h2>
              <button onClick={() => setShowGenerate(false)} className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <input value={genSubject} onChange={(e) => setGenSubject(e.target.value)}
              placeholder="Sujet (ex: la révolution française)"
              className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors" />
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-medium">Nombre de cartes</label>
              <select value={genNum} onChange={(e) => setGenNum(e.target.value)} className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none">
                <option value="5">5 cartes</option>
                <option value="10">10 cartes</option>
                <option value="15">15 cartes</option>
                <option value="20">20 cartes</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowGenerate(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl py-2.5 text-sm transition-colors">Annuler</button>
              <button onClick={handleGenerate} disabled={generating} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium transition-colors">
                {generating ? "Génération…" : "Générer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}