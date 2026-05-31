"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange, logOut } from "../auth";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firestore";

type Quiz = { id: string; title: string; subject: string; createdAt: any };
type Fiche = { id: string; title: string; subject: string; createdAt: any };

export default function TeacherPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "quiz" | "fiches" | "eleves" | "chat">("dashboard");
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [ficheList, setFicheList] = useState<Fiche[]>([]);
  const [eleves, setEleves] = useState<any[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showFicheModal, setShowFicheModal] = useState(false);
  const [quizSubject, setQuizSubject] = useState("");
  const [quizNum, setQuizNum] = useState("5");
  const [ficheSubject, setFicheSubject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: string; content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  // Calendrier
  const [events, setEvents] = useState<{id: string; title: string; date: string; type: string}[]>([
    { id: "1", title: "Examen de biologie", date: "2026-06-10", type: "examen" },
    { id: "2", title: "Quiz de mathématiques", date: "2026-06-15", type: "quiz" },
  ]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState("examen");

  useEffect(() => {
    const unsub = onAuthChange(async (user: any) => {
      if (!user) { router.push("/login"); return; }
      setEmail(user.email ?? "");
      setUserId(user.uid);
      // Charger élèves
      const elevesSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
      setEleves(elevesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleGenerateQuiz = async () => {
    setGenerating(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [], mode: "quiz", subject: quizSubject, numQuestions: quizNum }),
    });
    const data = await res.json();
    setGeneratedContent(data.reply);
    setQuizList(prev => [{ id: Date.now().toString(), title: `Quiz — ${quizSubject}`, subject: quizSubject, createdAt: new Date() }, ...prev]);
    setGenerating(false);
    setShowQuizModal(false);
  };

  const handleGenerateFiche = async () => {
    setGenerating(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [], mode: "fiche", subject: ficheSubject }),
    });
    const data = await res.json();
    setGeneratedContent(data.reply);
    setFicheList(prev => [{ id: Date.now().toString(), title: `Fiche — ${ficheSubject}`, subject: ficheSubject, createdAt: new Date() }, ...prev]);
    setGenerating(false);
    setShowFicheModal(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const newMsg = { role: "user", content: chatInput };
    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    setChatInput("");
    setChatLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updated }),
    });
    const data = await res.json();
    setChatMessages([...updated, { role: "assistant", content: data.reply }]);
    setChatLoading(false);
  };

  const addEvent = () => {
    if (!newEventTitle || !newEventDate) return;
    setEvents(prev => [...prev, { id: Date.now().toString(), title: newEventTitle, date: newEventDate, type: newEventType }]);
    setNewEventTitle(""); setNewEventDate(""); setShowEventModal(false);
  };

  const initials = email ? email[0].toUpperCase() : "?";

  return (
    <div className="flex h-screen bg-[#0d0d14] text-white" style={{fontFamily: "system-ui, sans-serif"}}>

      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0d14] border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm leading-none">Révisio IA</h1>
              <p className="text-purple-400 text-xs mt-0.5">Enseignant</p>
            </div>
          </div>
        </div>

        <div className="p-3 flex flex-col gap-1 flex-1">
          {[
            { key: "dashboard", label: "Dashboard", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
            { key: "chat", label: "Chat IA", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            { key: "quiz", label: "Mes quiz", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
            { key: "fiches", label: "Mes fiches", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
            { key: "eleves", label: "Mes élèves", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          ].map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key as any)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === item.key ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-gray-800 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-300 truncate">{email}</p>
            <p className="text-xs text-purple-400">Enseignant Pro</p>
          </div>
          <button onClick={async () => { await logOut(); router.push("/login"); }} className="text-gray-600 hover:text-red-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-[#0f0f1a]">

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="p-8 flex flex-col gap-6">
            <h2 className="text-2xl font-semibold">Dashboard</h2>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Élèves", value: eleves.length, color: "text-blue-400" },
                { label: "Quiz créés", value: quizList.length, color: "text-green-400" },
                { label: "Fiches créées", value: ficheList.length, color: "text-purple-400" },
                { label: "Évaluations", value: events.length, color: "text-orange-400" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-5">
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Calendrier */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Calendrier d'évaluations</h3>
                <button onClick={() => setShowEventModal(true)} className="bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">+ Ajouter</button>
              </div>
              <div className="flex flex-col gap-2">
                {events.sort((a, b) => a.date.localeCompare(b.date)).map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 bg-[#0f0f1a] rounded-xl px-4 py-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ev.type === "examen" ? "bg-red-400" : ev.type === "quiz" ? "bg-blue-400" : "bg-green-400"}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ev.title}</p>
                      <p className="text-gray-500 text-xs">{new Date(ev.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ev.type === "examen" ? "bg-red-900 text-red-300" : ev.type === "quiz" ? "bg-blue-900 text-blue-300" : "bg-green-900 text-green-300"}`}>{ev.type}</span>
                    <button onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                  </div>
                ))}
                {events.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Aucune évaluation planifiée</p>}
              </div>
            </div>

            {/* Contenu généré */}
            {generatedContent && (
              <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Dernier contenu généré</h3>
                  <button onClick={() => setGeneratedContent(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
                </div>
                <pre className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">{generatedContent}</pre>
              </div>
            )}
          </div>
        )}

        {/* Chat IA */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <p className="text-gray-400 text-sm">Chat IA pour enseignants — pose tes questions pédagogiques</p>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.role === "user" ? "bg-purple-600" : "bg-gray-700"}`}>
                    {m.role === "user" ? initials : "R"}
                  </div>
                  <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-purple-600 text-white rounded-tr-sm" : "bg-[#1a1a2e] text-gray-100 rounded-tl-sm border border-gray-800"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">R</div>
                  <div className="bg-[#1a1a2e] border border-gray-800 px-4 py-3 rounded-2xl flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}></div>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}></div>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}></div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-8 pb-6 pt-2">
              <div className="bg-[#1a1a2e] border border-gray-700 rounded-2xl flex items-center gap-3 px-4 py-3 focus-within:border-purple-600 transition-colors">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                  placeholder="Pose ta question pédagogique…"
                  className="flex-1 bg-transparent text-sm outline-none text-white placeholder-gray-600" />
                <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-30 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz */}
        {activeTab === "quiz" && (
          <div className="p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Mes quiz</h2>
              <button onClick={() => setShowQuizModal(true)} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors">+ Créer un quiz</button>
            </div>
            {quizList.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-gray-500 text-sm">Aucun quiz créé</p>
                <button onClick={() => setShowQuizModal(true)} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Créer mon premier quiz</button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {quizList.map(q => (
                <div key={q.id} className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
                  <p className="font-medium text-sm">{q.title}</p>
                  <p className="text-gray-500 text-xs">{q.subject}</p>
                  <button onClick={() => setGeneratedContent(null)} className="bg-gray-800 hover:bg-gray-700 rounded-lg py-1.5 text-xs transition-colors">Voir le contenu</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fiches */}
        {activeTab === "fiches" && (
          <div className="p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Mes fiches</h2>
              <button onClick={() => setShowFicheModal(true)} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors">+ Créer une fiche</button>
            </div>
            {ficheList.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-gray-500 text-sm">Aucune fiche créée</p>
                <button onClick={() => setShowFicheModal(true)} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Créer ma première fiche</button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {ficheList.map(f => (
                <div key={f.id} className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
                  <p className="font-medium text-sm">{f.title}</p>
                  <p className="text-gray-500 text-xs">{f.subject}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Élèves */}
        {activeTab === "eleves" && (
          <div className="p-8 flex flex-col gap-6">
            <h2 className="text-2xl font-semibold">Mes élèves</h2>
            {eleves.length === 0 && <p className="text-gray-500 text-sm">Aucun élève inscrit pour le moment.</p>}
            <div className="flex flex-col gap-2">
              {eleves.map(e => (
                <div key={e.id} className="bg-[#1a1a2e] border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center text-sm font-bold">{e.email?.[0]?.toUpperCase()}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{e.email}</p>
                    <p className="text-gray-500 text-xs">{e.plan === "pro_student" ? "Élève Pro" : "Gratuit"} · {e.messageCount ?? 0} messages</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${e.plan === "pro_student" ? "bg-blue-900 text-blue-300" : "bg-gray-800 text-gray-400"}`}>
                    {e.plan === "pro_student" ? "Pro" : "Free"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal Quiz */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Créer un quiz</h2>
              <button onClick={() => setShowQuizModal(false)} className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <input value={quizSubject} onChange={(e) => setQuizSubject(e.target.value)}
              placeholder="Sujet (ex: la photosynthèse)"
              className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors" />
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs">Nombre de questions</label>
              <select value={quizNum} onChange={(e) => setQuizNum(e.target.value)} className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none">
                <option value="3">3 questions</option>
                <option value="5">5 questions</option>
                <option value="10">10 questions</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowQuizModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl py-2.5 text-sm transition-colors">Annuler</button>
              <button onClick={handleGenerateQuiz} disabled={generating || !quizSubject.trim()} className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium transition-colors">
                {generating ? "Génération…" : "Générer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fiche */}
      {showFicheModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Créer une fiche</h2>
              <button onClick={() => setShowFicheModal(false)} className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <input value={ficheSubject} onChange={(e) => setFicheSubject(e.target.value)}
              placeholder="Sujet (ex: la révolution française)"
              className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors" />
            <div className="flex gap-2">
              <button onClick={() => setShowFicheModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl py-2.5 text-sm transition-colors">Annuler</button>
              <button onClick={handleGenerateFiche} disabled={generating || !ficheSubject.trim()} className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium transition-colors">
                {generating ? "Génération…" : "Générer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Événement */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Ajouter une évaluation</h2>
              <button onClick={() => setShowEventModal(false)} className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <input value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Titre (ex: Examen de chimie)"
              className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors" />
            <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)}
              className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors" />
            <select value={newEventType} onChange={(e) => setNewEventType(e.target.value)} className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none">
              <option value="examen">Examen</option>
              <option value="quiz">Quiz</option>
              <option value="devoir">Devoir</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowEventModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl py-2.5 text-sm transition-colors">Annuler</button>
              <button onClick={addEvent} disabled={!newEventTitle || !newEventDate} className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium transition-colors">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}