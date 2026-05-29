"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  collection, addDoc, getDocs,
  updateDoc, doc, orderBy, query,
  serverTimestamp, where
} from "firebase/firestore";
import { db } from "../firestore";
import { logOut, onAuthChange } from "../auth";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; messages: Message[] };

export default function StudentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizSubject, setQuizSubject] = useState("");
  const [quizNum, setQuizNum] = useState("5");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthChange((user: any) => {
      if (!user) router.push("/login");
      else { setUserId(user.uid); setUserEmail(user.email ?? ""); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const q = query(collection(db, "conversations"), where("userId", "==", userId), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setConversations(snap.docs.map((d) => ({ id: d.id, title: d.data().title, messages: d.data().messages ?? [] })));
    };
    load();
  }, [userId]);

  const handleNewChat = async () => {
    if (!userId) return;
    const docRef = await addDoc(collection(db, "conversations"), { title: "Nouveau chat", messages: [], createdAt: serverTimestamp(), userId });
    setConversations((prev) => [{ id: docRef.id, title: "Nouveau chat", messages: [] }, ...prev]);
    setCurrentId(docRef.id);
    setMessages([]);
    setFileContent(null); setFileName(null); setImageBase64(null); setImagePreview(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileContent((ev.target?.result as string).slice(0, 8000));
    reader.readAsText(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const b64 = ev.target?.result as string; setImageBase64(b64); setImagePreview(b64); };
    reader.readAsDataURL(file);
  };

  const handleSend = async (overrideInput?: string, mode?: string, subject?: string, numQuestions?: string) => {
    const text = overrideInput ?? input;
    if ((!text.trim() && !imageBase64) || !currentId) return;
    const userMsg: Message = {
      role: "user",
      content: mode === "quiz" ? `Quiz sur : ${subject ?? "mes notes"} (${numQuestions} questions)` : imageBase64 && !text.trim() ? "Image envoyée — analyse cette image" : text,
    };
    const updated = [...messages, userMsg];
    setMessages(updated); setInput(""); setLoading(true);
    const body: any = { messages: updated };
    if (mode === "quiz") { body.mode = "quiz"; body.subject = subject; body.numQuestions = numQuestions; }
    if (fileContent) body.fileContent = fileContent;
    if (imageBase64) { body.imageBase64 = imageBase64; setImageBase64(null); setImagePreview(null); }
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    const aiMsg: Message = { role: "assistant", content: data.reply };
    const final = [...updated, aiMsg];
    setMessages(final); setLoading(false);
    const title = userMsg.content.slice(0, 40);
    await updateDoc(doc(db, "conversations", currentId), { messages: final, title });
    setConversations((prev) => prev.map((c) => c.id === currentId ? { ...c, messages: final, title } : c));
  };

  const handleGenerateQuiz = async () => {
    if (!currentId) return;
    setShowQuiz(false);
    await handleSend("quiz", "quiz", quizSubject || "mes notes", quizNum);
    setQuizSubject("");
  };

  const initials = userEmail ? userEmail[0].toUpperCase() : "?";

  return (
    <div className="flex h-screen bg-[#0d0d14] text-white" style={{fontFamily: "system-ui, sans-serif"}}>

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-[#0d0d14] border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm leading-none">Révisio IA</h1>
              <p className="text-gray-500 text-xs mt-0.5">Assistant scolaire</p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <button onClick={handleNewChat} className="w-full bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5">
          {conversations.length === 0 && (
            <p className="text-gray-600 text-xs text-center mt-6">Aucune conversation</p>
          )}
          {conversations.map((c) => (
            <button key={c.id}
              onClick={() => { setCurrentId(c.id); setMessages(c.messages); }}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg truncate transition-colors flex items-center gap-2 ${currentId === c.id ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 opacity-60"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-gray-800 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-300 truncate">{userEmail}</p>
          </div>
          <button onClick={async () => { await logOut(); router.push("/login"); }} title="Se déconnecter" className="text-gray-600 hover:text-red-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <main className="flex flex-col flex-1 bg-[#0f0f1a]">

        {/* Header */}
        <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between h-12">
          <p className="text-sm text-gray-400">
            {currentId ? conversations.find(c => c.id === currentId)?.title ?? "Conversation" : "Sélectionne ou crée un chat"}
          </p>
          {fileName && (
            <div className="flex items-center gap-2 bg-blue-950 border border-blue-800 px-3 py-1 rounded-lg">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className="text-blue-300 text-xs">{fileName}</span>
              <button onClick={() => { setFileContent(null); setFileName(null); }} className="text-gray-500 hover:text-red-400 text-xs ml-1">✕</button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {!currentId && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center h-full">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-200">Bienvenue sur Révisio IA</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-xs">Crée un nouveau chat pour commencer à poser tes questions, générer un quiz ou analyser tes notes.</p>
              </div>
              <button onClick={handleNewChat} className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                Créer un chat
              </button>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${m.role === "user" ? "bg-blue-600" : "bg-gray-700"}`}>
                {m.role === "user" ? initials : "R"}
              </div>
              <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-[#1a1a2e] text-gray-100 rounded-tl-sm border border-gray-800"}`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">R</div>
              <div className="bg-[#1a1a2e] border border-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}></div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Aperçu image */}
        {imagePreview && (
          <div className="px-6 pb-2 flex items-center gap-3">
            <img src={imagePreview} alt="preview" className="h-14 w-14 object-cover rounded-lg border border-gray-700" />
            <span className="text-gray-400 text-xs">Image prête à envoyer</span>
            <button onClick={() => { setImageBase64(null); setImagePreview(null); }} className="text-gray-500 hover:text-red-400 text-xs">Retirer</button>
          </div>
        )}

        {/* Barre de saisie */}
        <div className="px-6 pb-6 pt-2">
          <div className="bg-[#1a1a2e] border border-gray-700 rounded-2xl flex flex-col overflow-hidden focus-within:border-blue-600 transition-colors">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={currentId ? "Pose ta question à Révisio IA…" : "Crée un nouveau chat d'abord"}
              disabled={!currentId}
              className="bg-transparent px-4 pt-4 pb-2 text-sm outline-none text-white placeholder-gray-600 disabled:opacity-50"
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex gap-1">
                <input type="file" accept=".txt,.md,.csv" ref={fileRef} onChange={handleFileUpload} className="hidden" />
                <input type="file" accept="image/*" ref={imageRef} onChange={handleImageUpload} className="hidden" />
                <button onClick={() => fileRef.current?.click()} title="Uploader tes notes" className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </button>
                <button onClick={() => imageRef.current?.click()} title="Envoyer une photo" className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
                <button onClick={() => setShowQuiz(true)} className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors text-xs font-medium flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Quiz
                </button>
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!currentId || loading || (!input.trim() && !imageBase64)}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                Envoyer
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal Quiz ── */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Générer un quiz</h2>
              <button onClick={() => setShowQuiz(false)} className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {fileName && (
              <div className="text-blue-300 text-xs bg-blue-950 border border-blue-800 px-3 py-2 rounded-lg flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                Basé sur : {fileName}
              </div>
            )}
            <input
              value={quizSubject}
              onChange={(e) => setQuizSubject(e.target.value)}
              placeholder={fileName ? "Sujet précis (optionnel)" : "Matière (ex: la photosynthèse)"}
              className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 text-xs font-medium">Nombre de questions</label>
              <select value={quizNum} onChange={(e) => setQuizNum(e.target.value)} className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none">
                <option value="3">3 questions</option>
                <option value="5">5 questions</option>
                <option value="10">10 questions</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowQuiz(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl py-2.5 text-sm transition-colors">Annuler</button>
              <button onClick={handleGenerateQuiz} disabled={!currentId} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium transition-colors">
                Générer
              </button>
            </div>
            {!currentId && <p className="text-red-400 text-xs text-center">Crée un nouveau chat d'abord</p>}
          </div>
        </div>
      )}
    </div>
  );
} 