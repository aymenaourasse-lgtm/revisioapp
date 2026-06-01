"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange, logOut } from "../auth";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firestore";
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

type Quiz = { id: string; title: string; subject: string; content: string; createdAt: any };
type Fiche = { id: string; title: string; subject: string; content: string; createdAt: any };

export default function TeacherPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "quiz" | "fiches" | "eleves" | "chat" | "profil">("dashboard");
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
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [userPlan, setUserPlan] = useState("pro_teacher");
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

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
      const elevesSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
      setEleves(elevesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserPlan(data.plan ?? "pro_teacher");
        setSubscriptionId(data.subscriptionId ?? null);
      }
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
    const newQuiz: Quiz = { id: Date.now().toString(), title: `Quiz — ${quizSubject}`, subject: quizSubject, content: data.reply, createdAt: new Date() };
    setQuizList(prev => [newQuiz, ...prev]);
    setGenerating(false);
    setShowQuizModal(false);
    setQuizSubject("");
    setSelectedContent(data.reply);
    setSelectedTitle(`Quiz — ${quizSubject}`);
  };

  const handleGenerateFiche = async () => {
    setGenerating(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [], mode: "fiche", subject: ficheSubject }),
    });
    const data = await res.json();
    const newFiche: Fiche = { id: Date.now().toString(), title: `Fiche — ${ficheSubject}`, subject: ficheSubject, content: data.reply, createdAt: new Date() };
    setFicheList(prev => [newFiche, ...prev]);
    setGenerating(false);
    setShowFicheModal(false);
    setFicheSubject("");
    setSelectedContent(data.reply);
    setSelectedTitle(`Fiche — ${ficheSubject}`);
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

  const handleCancelSubscription = async () => {
    if (!confirm("Confirmer l'annulation de l'abonnement ?")) return;
    setCancelLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) setCancelSuccess(true);
    } catch (e) {}
    setCancelLoading(false);
  };

  const handleChangePassword = async () => {
    if (newPasswordVal !== confirmPassword) { setPasswordMsg("Les mots de passe ne correspondent pas."); return; }
    if (newPasswordVal.length < 6) { setPasswordMsg("Le mot de passe doit contenir au moins 6 caractères."); return; }
    setPasswordLoading(true);
    setPasswordMsg("");
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) return;
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPasswordVal);
      setPasswordMsg("Mot de passe changé avec succès !");
      setOldPassword(""); setNewPasswordVal(""); setConfirmPassword("");
    } catch (e: any) {
      setPasswordMsg("Erreur : mot de passe actuel incorrect.");
    }
    setPasswordLoading(false);
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
            { key: "profil", label: "Mon profil", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
          ].map(item => (
            <button key={item.key} onClick={() => { setActiveTab(item.key as any); setSelectedContent(null); }}
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
                  <p className="text-gray-400 text-sm">Chat IA pour enseignants</p>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.role === "user" ? "bg-purple-600" : "bg-[#1a1a2e] border border-gray-700"}`}>
                    {m.role === "user" ? initials : (
                      <div className="w-5 h-5 bg-purple-600 rounded-md flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      </div>
                    )}
                  </div>
                  <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-purple-600 text-white rounded-tr-sm" : "bg-[#1a1a2e] text-gray-100 rounded-tl-sm border border-gray-800"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#1a1a2e] border border-gray-700 flex items-center justify-center">
                    <div className="w-5 h-5 bg-purple-600 rounded-md flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </div>
                  </div>
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
        {activeTab === "quiz" && !selectedContent && (
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
                  <button onClick={() => { setSelectedContent(q.content); setSelectedTitle(q.title); }} className="bg-gray-800 hover:bg-gray-700 rounded-lg py-1.5 text-xs transition-colors">Voir le contenu</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fiches */}
        {activeTab === "fiches" && !selectedContent && (
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
                  <button onClick={() => { setSelectedContent(f.content); setSelectedTitle(f.title); }} className="bg-gray-800 hover:bg-gray-700 rounded-lg py-1.5 text-xs transition-colors">Voir le contenu</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vue contenu */}
        {selectedContent && (
          <div className="p-8 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedContent(null)} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                Retour
              </button>
              <h2 className="text-lg font-semibold">{selectedTitle}</h2>
            </div>
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{selectedContent}</pre>
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

        {/* Profil */}
        {activeTab === "profil" && (
          <div className="p-8 flex flex-col gap-6 max-w-2xl">

            {/* Header */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center text-2xl font-black shadow-lg shadow-purple-900/40">{initials}</div>
              <div>
                <h2 className="text-2xl font-bold text-white">{email}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm text-purple-400 font-medium">Enseignant Pro · Actif</span>
                </div>
              </div>
            </div>

            {/* Infos compte */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <h3 className="font-semibold text-sm text-white">Informations du compte</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Email", value: email },
                  { label: "Rôle", value: "Enseignant" },
                  { label: "Abonnement", value: "Enseignant Pro", purple: true },
                  { label: "Statut", value: "Actif", green: true },
                ].map((item: any, i) => (
                  <div key={i} className="bg-[#0f0f1a] border border-gray-800 rounded-xl p-3.5">
                    <p className="text-gray-500 text-xs mb-1">{item.label}</p>
                    <p className={`text-sm font-medium truncate ${item.purple ? "text-purple-400" : item.green ? "text-green-400" : "text-white"}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <h3 className="font-semibold text-sm text-white">Statistiques</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Élèves", value: eleves.length, color: "text-blue-400", bg: "bg-blue-900/20 border-blue-900/50" },
                  { label: "Quiz créés", value: quizList.length, color: "text-green-400", bg: "bg-green-900/20 border-green-900/50" },
                  { label: "Fiches créées", value: ficheList.length, color: "text-purple-400", bg: "bg-purple-900/20 border-purple-900/50" },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.bg} border rounded-2xl p-4 text-center`}>
                    <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Changer mot de passe */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <h3 className="font-semibold text-sm text-white">Changer le mot de passe</h3>
              </div>
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Mot de passe actuel"
                className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors placeholder-gray-600 text-white" />
              <input type="password" value={newPasswordVal} onChange={(e) => setNewPasswordVal(e.target.value)}
                placeholder="Nouveau mot de passe"
                className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors placeholder-gray-600 text-white" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le nouveau mot de passe"
                className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors placeholder-gray-600 text-white" />
              {passwordMsg && (
                <p className={`text-xs px-1 ${passwordMsg.includes("succès") ? "text-green-400" : "text-red-400"}`}>{passwordMsg}</p>
              )}
              <button onClick={handleChangePassword} disabled={passwordLoading || !oldPassword || !newPasswordVal || !confirmPassword}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl py-3 text-sm font-semibold transition-colors shadow-lg shadow-purple-900/30">
                {passwordLoading ? "Changement en cours…" : "Mettre à jour le mot de passe"}
              </button>
            </div>

            {/* Zone dangereuse */}
            <div className="bg-[#1a1a2e] border border-red-900/50 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <h3 className="font-semibold text-sm text-red-400">Zone dangereuse</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">L'annulation de ton abonnement prendra effet à la fin de la période de facturation en cours. Tu conserveras l'accès jusqu'à cette date.</p>
              {cancelSuccess ? (
                <div className="bg-green-900/20 border border-green-800 rounded-xl px-4 py-3">
                  <p className="text-green-400 text-sm font-medium">Abonnement annulé avec succès.</p>
                </div>
              ) : (
                <button onClick={handleCancelSubscription} disabled={cancelLoading}
                  className="bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 text-red-400 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50">
                  {cancelLoading ? "Annulation en cours…" : "Annuler mon abonnement"}
                </button>
              )}
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