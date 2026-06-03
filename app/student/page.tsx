"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  collection, addDoc, getDocs,
  updateDoc, doc, orderBy, query,
  serverTimestamp, where, deleteDoc,
  getDoc, setDoc
} from "firebase/firestore";
import { db } from "../firestore";
import { logOut, onAuthChange } from "../auth";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; messages: Message[] };
type QuizQuestion = {
  type: "qcm" | "dev";
  question: string;
  options?: string[];
  correct?: number;
  explanation?: string;
  reponse_ideale?: string;
};
type QuizCorrection = {
  note: number;
  appreciation: string;
  commentaire: string;
  correction: string;
};

const FREE_LIMIT = 50;

export default function StudentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isPro, setIsPro] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showFiche, setShowFiche] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [quizSubject, setQuizSubject] = useState("");
  const [quizNum, setQuizNum] = useState("5");
  const [quizDifficulty, setQuizDifficulty] = useState("general");
  const [quizType, setQuizType] = useState("qcm");
  const [ficheSubject, setFicheSubject] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [activeQuizDifficulty, setActiveQuizDifficulty] = useState("general");
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [devAnswers, setDevAnswers] = useState<string[]>([]);
  const [devCorrections, setDevCorrections] = useState<(QuizCorrection | null)[]>([]);
  const [devCorrecting, setDevCorrecting] = useState<boolean[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const quizFileRef = useRef<HTMLInputElement>(null);
  const quizImageRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

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
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const q = query(collection(db, "conversations"), where("userId", "==", userId), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setConversations(snap.docs.map((d) => ({ id: d.id, title: d.data().title, messages: d.data().messages ?? [] })));
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setIsPro(data.plan === "pro");
        const today = new Date().toDateString();
        if (data.lastMessageDate === today) {
          setMessageCount(data.messageCount ?? 0);
        } else {
          setMessageCount(0);
        }
      }
    };
    load();
  }, [userId]);

  const checkAndIncrementCount = async () => {
    if (isPro) return true;
    if (messageCount >= FREE_LIMIT) { setShowLimitModal(true); return false; }
    const today = new Date().toDateString();
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    await setDoc(doc(db, "users", userId!), { messageCount: newCount, lastMessageDate: today }, { merge: true });
    return true;
  };

  const handleNewChat = async () => {
    if (!userId) return;
    const docRef = await addDoc(collection(db, "conversations"), { title: "Nouveau chat", messages: [], createdAt: serverTimestamp(), userId });
    setConversations((prev) => [{ id: docRef.id, title: "Nouveau chat", messages: [] }, ...prev]);
    setCurrentId(docRef.id);
    setMessages([]);
    setFileContent(null); setFileName(null); setImageBase64(null); setImagePreview(null);
    setActiveQuiz(null); setQuizAnswers([]); setDevAnswers([]); setDevCorrections([]); setDevCorrecting([]); setQuizSubmitted(false);
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm("Supprimer cette conversation ?")) return;
    await deleteDoc(doc(db, "conversations", id));
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentId === id) { setCurrentId(null); setMessages([]); setActiveQuiz(null); }
  };

  const handleRename = async (id: string) => {
    if (!editingTitle.trim()) { setEditingId(null); return; }
    await updateDoc(doc(db, "conversations", id), { title: editingTitle.trim() });
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: editingTitle.trim() } : c));
    setEditingId(null);
  };

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    const maxPages = Math.min(pdf.numPages, 10);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return text.slice(0, 8000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const text = await extractPdfText(file);
      setFileContent(text);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => setFileContent((ev.target?.result as string).slice(0, 8000));
      reader.readAsText(file);
    }
  };

  const handleQuizFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPdfLoading(true);
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const text = await extractPdfText(file);
      setFileContent(text);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => setFileContent((ev.target?.result as string).slice(0, 8000));
      reader.readAsText(file);
    }
    setPdfLoading(false);
  };

  const handleQuizImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX) { h = (h * MAX) / w; w = MAX; }
        if (h > MAX) { w = (w * MAX) / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const b64 = canvas.toDataURL("image/jpeg", 0.7);
        setImageBase64(b64);
        setFileName(file.name);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX) { h = (h * MAX) / w; w = MAX; }
        if (h > MAX) { w = (w * MAX) / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const b64 = canvas.toDataURL("image/jpeg", 0.7);
        setImageBase64(b64);
        setImagePreview(b64);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCorrectDevAnswer = async (qi: number) => {
    if (!activeQuiz) return;
    const q = activeQuiz[qi];
    const answer = devAnswers[qi];
    if (!answer?.trim()) return;
    const newCorrecting = [...devCorrecting];
    newCorrecting[qi] = true;
    setDevCorrecting(newCorrecting);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [], mode: "quiz_correction", question: q.question, studentAnswer: answer }),
    });
    const data = await res.json();
    try {
      const clean = data.reply.replace(/```json|```/g, "").trim();
      const correction: QuizCorrection = JSON.parse(clean);
      const newCorrections = [...devCorrections];
      newCorrections[qi] = correction;
      setDevCorrections(newCorrections);
      if (currentId && activeQuiz) {
        await updateDoc(doc(db, "conversations", currentId), {
          quizData: activeQuiz,
          quizAnswers: quizAnswers,
          devAnswers: devAnswers,
          devCorrections: newCorrections,
          quizSubmitted,
          quizDifficulty: activeQuizDifficulty,
        });
      }
    } catch {}
    const newCorrecting2 = [...devCorrecting];
    newCorrecting2[qi] = false;
    setDevCorrecting(newCorrecting2);
  };

  const handleSend = async (overrideInput?: string, mode?: string, subject?: string, numQuestions?: string, difficulty?: string, questionType?: string) => {
    const text = overrideInput ?? input;
    if ((!text.trim() && !imageBase64 && mode !== "resume") || !currentId) return;
    const canSend = await checkAndIncrementCount();
    if (!canSend) return;
    const userMsg: Message = {
      role: "user",
      content: mode === "quiz" ? `Quiz sur : ${subject ?? "mes notes"} (${numQuestions} questions)`
        : mode === "fiche" ? `Fiche de révision : ${subject ?? "mes notes"}`
        : mode === "resume" ? `Résumé du document : ${fileName ?? "mes notes"}`
        : imageBase64 && !text.trim() ? "Image envoyée — analyse cette image"
        : text,
    };
    const updated = [...messages, userMsg];
    setMessages(updated); setInput(""); setLoading(true);
    setActiveQuiz(null); setQuizAnswers([]); setDevAnswers([]); setDevCorrections([]); setDevCorrecting([]); setQuizSubmitted(false);
    const body: any = { messages: updated };
    if (mode === "quiz") { body.mode = "quiz"; body.subject = subject; body.numQuestions = numQuestions; body.difficulty = difficulty; body.questionType = questionType; }
    if (mode === "fiche") { body.mode = "fiche"; body.subject = subject; }
    if (mode === "resume") { body.mode = "resume"; }
    if (fileContent) body.fileContent = fileContent;
    if (imageBase64) { body.imageBase64 = imageBase64; setImageBase64(null); setImagePreview(null); }
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    const reply = data.reply;

    if (mode === "quiz") {
      try {
        const clean = reply.replace(/```json|```/g, "").trim();
        const parsed: QuizQuestion[] = JSON.parse(clean);
        setActiveQuiz(parsed);
        setActiveQuizDifficulty(difficulty ?? "general");
        setQuizAnswers(new Array(parsed.length).fill(null));
        setDevAnswers(new Array(parsed.length).fill(""));
        setDevCorrections(new Array(parsed.length).fill(null));
        setDevCorrecting(new Array(parsed.length).fill(false));
        const aiMsg: Message = { role: "assistant", content: "__QUIZ__" };
        const final = [...updated, aiMsg];
        setMessages(final); setLoading(false);
        const title = userMsg.content.slice(0, 40);
        await updateDoc(doc(db, "conversations", currentId), {
          messages: final,
          title,
          quizData: parsed,
          quizAnswers: new Array(parsed.length).fill(null),
          devAnswers: new Array(parsed.length).fill(""),
          devCorrections: new Array(parsed.length).fill(null),
          quizSubmitted: false,
          quizDifficulty: difficulty ?? "general",
        });
        setConversations((prev) => prev.map((c) => c.id === currentId ? { ...c, messages: final, title } : c));
        return;
      } catch {}
    }

    const aiMsg: Message = { role: "assistant", content: reply };
    const final = [...updated, aiMsg];
    setMessages(final); setLoading(false);
    const title = userMsg.content.slice(0, 40);
    await updateDoc(doc(db, "conversations", currentId), { messages: final, title });
    setConversations((prev) => prev.map((c) => c.id === currentId ? { ...c, messages: final, title } : c));
  };

  const loadConversation = async (c: Conversation) => {
    setCurrentId(c.id);
    setMessages(c.messages);
    setActiveQuiz(null); setQuizAnswers([]); setDevAnswers([]); setDevCorrections([]); setDevCorrecting([]); setQuizSubmitted(false);
    const snap = await getDoc(doc(db, "conversations", c.id));
    if (snap.exists()) {
      const data = snap.data();
      if (data.quizData) {
        setActiveQuiz(data.quizData);
        setActiveQuizDifficulty(data.quizDifficulty ?? "general");
        setQuizAnswers(data.quizAnswers ?? new Array(data.quizData.length).fill(null));
        setDevAnswers(data.devAnswers ?? new Array(data.quizData.length).fill(""));
        setDevCorrections(data.devCorrections ?? new Array(data.quizData.length).fill(null));
        setDevCorrecting(new Array(data.quizData.length).fill(false));
        setQuizSubmitted(data.quizSubmitted ?? false);
      }
    }
  };

  const handleGenerateQuiz = async () => {
    if (!currentId) return;
    setShowQuiz(false);
    const subject = quizSubject || (fileContent ? "le contenu du fichier fourni" : "mes notes");
    await handleSend("quiz", "quiz", subject, quizNum, quizDifficulty, quizType);
    setQuizSubject("");
  };

  const handleGenerateFiche = async () => {
    if (!currentId) return;
    setShowFiche(false);
    await handleSend("fiche", "fiche", ficheSubject || "mes notes");
    setFicheSubject("");
  };

  const handleGenerateResume = async () => {
    setShowResume(false);
    await handleSend("resume", "resume");
  };

  const handleQuizAnswer = (qIndex: number, aIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => { const n = [...prev]; n[qIndex] = aIndex; return n; });
  };

  const handleQuizSubmit = async () => {
    setQuizSubmitted(true);
    if (currentId && activeQuiz) {
      await updateDoc(doc(db, "conversations", currentId), {
        quizAnswers,
        devAnswers,
        quizSubmitted: true,
      });
    }
  };

  const quizScore = activeQuiz ? activeQuiz.filter((q, i) => q.type === "qcm" && quizAnswers[i] === q.correct).length : 0;
  const qcmCount = activeQuiz ? activeQuiz.filter(q => q.type === "qcm").length : 0;
  const initials = userEmail ? userEmail[0].toUpperCase() : "?";
  const remaining = FREE_LIMIT - messageCount;

  const difficultyLabels: Record<string, string> = {
    general: "Général",
    avance: "Avancé",
    precis: "Précis",
    examen: "Examen",
  };

  const getNoteColor = (note: number) => {
    if (note >= 80) return "text-green-400";
    if (note >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const renderMessage = (m: Message, i: number) => {
    if (m.role === "assistant" && m.content === "__QUIZ__" && activeQuiz) {
      return (
        <div key={i} className="flex gap-3 flex-row">
          <div className="w-7 h-7 rounded-full bg-[#1a1a2e] border border-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
          </div>
          <div className="flex-1 max-w-2xl bg-[#1a1a2e] border border-gray-800 rounded-2xl rounded-tl-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-blue-600/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Quiz généré par IA</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{difficultyLabels[activeQuizDifficulty]}</span>
              <span className="ml-auto text-gray-500 text-xs">{activeQuiz.length} questions</span>
            </div>
            <div className="p-4 flex flex-col gap-6">
              {activeQuiz.map((q, qi) => (
                <div key={qi} className="flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${q.type === "qcm" ? "bg-blue-900/50 text-blue-300" : "bg-purple-900/50 text-purple-300"}`}>
                      {q.type === "qcm" ? "QCM" : "Développement"}
                    </span>
                    <p className="text-sm font-medium text-gray-200">Question {qi + 1} : {q.question}</p>
                  </div>

                  {q.type === "qcm" && q.options && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, ai) => {
                          const isSelected = quizAnswers[qi] === ai;
                          const isCorrect = ai === q.correct;
                          let cls = "text-left px-3 py-2.5 rounded-xl text-sm border transition-all ";
                          if (!quizSubmitted) {
                            cls += isSelected ? "border-blue-500 bg-blue-600/20 text-white" : "border-gray-700 bg-[#0f0f1a] text-gray-300 hover:border-gray-500 hover:text-white";
                          } else {
                            if (isCorrect) cls += "border-green-500 bg-green-900/30 text-green-300";
                            else if (isSelected && !isCorrect) cls += "border-red-500 bg-red-900/30 text-red-300";
                            else cls += "border-gray-700 bg-[#0f0f1a] text-gray-500 opacity-50";
                          }
                          return (
                            <button key={ai} onClick={() => handleQuizAnswer(qi, ai)} className={cls}>
                              <span className="text-xs opacity-60 mr-1.5">{["A", "B", "C", "D"][ai]})</span>{opt}
                              {quizSubmitted && isCorrect && <span className="ml-1">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && q.explanation && (
                        <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs border ${quizAnswers[qi] === q.correct ? "bg-green-900/20 border-green-800/50 text-green-300" : "bg-orange-900/20 border-orange-800/50 text-orange-300"}`}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </>
                  )}

                  {q.type === "dev" && (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={devAnswers[qi] ?? ""}
                        onChange={(e) => {
                          const n = [...devAnswers]; n[qi] = e.target.value; setDevAnswers(n);
                        }}
                        disabled={!!devCorrections[qi]}
                        placeholder="Écris ta réponse ici…"
                        rows={4}
                        className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-600 resize-none disabled:opacity-60"
                      />
                      {!devCorrections[qi] && (
                        <button
                          onClick={() => handleCorrectDevAnswer(qi)}
                          disabled={!devAnswers[qi]?.trim() || devCorrecting[qi]}
                          className="self-end bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2"
                        >
                          {devCorrecting[qi] ? (
                            <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>Correction en cours…</>
                          ) : "Corriger ma réponse →"}
                        </button>
                      )}
                      {devCorrections[qi] && (
                        <div className="bg-[#0f0f1a] border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Correction IA</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${getNoteColor(devCorrections[qi]!.note)}`}>{devCorrections[qi]!.note}/100</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getNoteColor(devCorrections[qi]!.note)} bg-gray-800`}>{devCorrections[qi]!.appreciation}</span>
                            </div>
                          </div>
                          <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2">
                            <p className="text-xs text-blue-300 font-medium mb-1">Commentaire</p>
                            <p className="text-xs text-gray-300">{devCorrections[qi]!.commentaire}</p>
                          </div>
                          <div className="bg-green-900/20 border border-green-800/40 rounded-lg px-3 py-2">
                            <p className="text-xs text-green-300 font-medium mb-1">Réponse idéale</p>
                            <p className="text-xs text-gray-300">{devCorrections[qi]!.correction}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {!quizSubmitted && qcmCount > 0 && (
                <button onClick={handleQuizSubmit} disabled={activeQuiz.filter(q => q.type === "qcm").some((_, i) => quizAnswers[activeQuiz.indexOf(activeQuiz.filter(q => q.type === "qcm")[i])] === null)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-2.5 text-sm font-semibold transition-colors mt-2">
                  Soumettre les QCM
                </button>
              )}

              {quizSubmitted && qcmCount > 0 && (
                <div className="bg-[#0f0f1a] border border-gray-700 rounded-xl p-4 text-center">
                  <p className="text-lg font-bold">{quizScore}/{qcmCount} QCM</p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {quizScore === qcmCount ? "Parfait !" : quizScore >= qcmCount / 2 ? "Bon travail !" : "Continue à réviser !"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${m.role === "user" ? "bg-blue-600" : "bg-[#1a1a2e] border border-gray-700"}`}>
          {m.role === "user" ? initials : (
            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
          )}
        </div>
        <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-[#1a1a2e] text-gray-100 rounded-tl-sm border border-gray-800"}`}>
          {m.content}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#0d0d14] text-white" style={{fontFamily: "system-ui, sans-serif"}}>

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

        <div className="p-3 flex flex-col gap-1 border-b border-gray-800">
          <button onClick={() => router.push("/student/flashcards")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Flashcards
          </button>
          <button onClick={() => router.push("/student/profile")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profil
          </button>
        </div>

        <div className="p-3">
          <button onClick={handleNewChat} className="w-full bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5">
          {conversations.length === 0 && <p className="text-gray-600 text-xs text-center mt-6">Aucune conversation</p>}
          {conversations.map((c) => (
            <div key={c.id} className={`group flex items-center gap-1 rounded-lg ${currentId === c.id ? "bg-blue-600" : "hover:bg-gray-800"}`}>
              {editingId === c.id ? (
                <input ref={editInputRef} value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => handleRename(c.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRename(c.id); if (e.key === "Escape") setEditingId(null); }}
                  className="flex-1 bg-transparent text-sm px-3 py-2 outline-none text-white" />
              ) : (
                <button onClick={() => loadConversation(c)}
                  onDoubleClick={() => { setEditingId(c.id); setEditingTitle(c.title); }}
                  className={`flex-1 text-left text-sm px-3 py-2 truncate flex items-center gap-2 ${currentId === c.id ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 opacity-60"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span className="truncate">{c.title}</span>
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(c.id); }}
                className={`opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded transition-all hover:text-red-400 ${currentId === c.id ? "text-blue-200" : "text-gray-600"}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          ))}
        </div>

        {!isPro && (
          <div className="px-3 pb-2">
            <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Messages aujourd'hui</span>
                <span className={`text-xs font-medium ${remaining <= 5 ? "text-red-400" : "text-gray-300"}`}>{messageCount}/{FREE_LIMIT}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${remaining <= 5 ? "bg-red-500" : "bg-blue-500"}`} style={{width: `${(messageCount / FREE_LIMIT) * 100}%`}}></div>
              </div>
              <button onClick={() => router.push("/pricing")} className="text-blue-400 text-xs hover:underline text-center">Passer à Pro — illimité</button>
            </div>
          </div>
        )}

        <div className="p-3 border-t border-gray-800 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-300 truncate">{userEmail}</p>
            {isPro && <p className="text-xs text-blue-400">Pro</p>}
          </div>
          <button onClick={async () => { await logOut(); router.push("/login"); }} className="text-gray-600 hover:text-red-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      <main className="flex flex-col flex-1 bg-[#0f0f1a]">
        <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between h-12">
          <p className="text-sm text-gray-400">{currentId ? conversations.find(c => c.id === currentId)?.title ?? "Conversation" : "Sélectionne ou crée un chat"}</p>
          {fileName && (
            <div className="flex items-center gap-2 bg-blue-950 border border-blue-800 px-3 py-1 rounded-lg">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className="text-blue-300 text-xs">{fileName}</span>
              <button onClick={() => { setFileContent(null); setFileName(null); }} className="text-gray-500 hover:text-red-400 text-xs ml-1">✕</button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {!currentId && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center h-full">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-200">Bienvenue sur Révisio IA</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-xs">Pose tes questions, génère un quiz, crée une fiche de révision ou analyse tes notes.</p>
              </div>
              <button onClick={handleNewChat} className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-sm font-medium transition-colors">Créer un chat</button>
            </div>
          )}
          {messages.map((m, i) => renderMessage(m, i))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#1a1a2e] border border-gray-700 flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </div>
              </div>
              <div className="bg-[#1a1a2e] border border-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}></div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {imagePreview && (
          <div className="px-6 pb-2 flex items-center gap-3">
            <img src={imagePreview} alt="preview" className="h-14 w-14 object-cover rounded-lg border border-gray-700" />
            <span className="text-gray-400 text-xs">Image prête à envoyer</span>
            <button onClick={() => { setImageBase64(null); setImagePreview(null); }} className="text-gray-500 hover:text-red-400 text-xs">Retirer</button>
          </div>
        )}

        <div className="px-6 pb-6 pt-2">
          <div className="bg-[#1a1a2e] border border-gray-700 rounded-2xl flex flex-col overflow-hidden focus-within:border-blue-600 transition-colors">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={currentId ? "Pose ta question à Révisio IA…" : "Crée un nouveau chat d'abord"}
              disabled={!currentId}
              className="bg-transparent px-4 pt-4 pb-2 text-sm outline-none text-white placeholder-gray-600 disabled:opacity-50" />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex gap-1">
                <input type="file" accept=".txt,.md,.csv,.pdf" ref={fileRef} onChange={handleFileUpload} className="hidden" />
                <input type="file" accept="image/*" ref={imageRef} onChange={handleImageUpload} className="hidden" />
                <input type="file" accept=".txt,.md,.csv,.pdf" ref={quizFileRef} onChange={handleQuizFileUpload} className="hidden" />
                <input type="file" accept="image/*" ref={quizImageRef} onChange={handleQuizImageUpload} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </button>
                <button onClick={() => imageRef.current?.click()} className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
                <button onClick={() => setShowQuiz(true)} className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors text-xs font-medium flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Quiz
                </button>
                <button onClick={() => setShowFiche(true)} className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors text-xs font-medium flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  Fiche
                </button>
                <button onClick={() => setShowResume(true)} className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors text-xs font-medium flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="11" y2="18"/></svg>
                  Résumé
                </button>
                <button onClick={() => router.push("/student/flashcards")} className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors text-xs font-medium flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  Flashcards
                </button>
              </div>
              <button onClick={() => handleSend()} disabled={!currentId || loading || (!input.trim() && !imageBase64)}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                Envoyer
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-orange-900 rounded-full flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <h2 className="text-base font-semibold">Limite quotidienne atteinte</h2>
              <p className="text-gray-400 text-sm mt-1">Tu as utilisé tes {FREE_LIMIT} messages gratuits aujourd'hui.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => router.push("/pricing")} className="bg-blue-600 hover:bg-blue-500 rounded-xl py-2.5 text-sm font-medium transition-colors">Passer à Pro →</button>
              <button onClick={() => setShowLimitModal(false)} className="bg-gray-800 hover:bg-gray-700 rounded-xl py-2.5 text-sm transition-colors text-gray-400">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showQuiz && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f1a] border border-gray-700/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border-b border-gray-800 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Générer un quiz</h2>
                  <p className="text-gray-500 text-xs">Teste tes connaissances avec l'IA</p>
                </div>
              </div>
              <button onClick={() => setShowQuiz(false)} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-800 transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              {!fileName && !imageBase64 ? (
                <div className="border-2 border-dashed border-gray-700 rounded-2xl p-5 flex flex-col items-center gap-3 bg-[#1a1a2e]/40">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-300 font-medium">Uploade tes notes</p>
                    <p className="text-gray-500 text-xs mt-0.5">PDF, fichier texte ou photo de tes notes</p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <button onClick={() => quizFileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl py-2.5 text-xs font-medium text-gray-300 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      PDF / Fichier
                    </button>
                    <button onClick={() => quizImageRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl py-2.5 text-xs font-medium text-gray-300 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      Photo de notes
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs">ou entre un sujet manuellement ci-dessous</p>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-blue-950/50 border border-blue-800/50 px-4 py-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    {pdfLoading ? <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                    <span className="text-blue-300 text-xs font-medium">{pdfLoading ? "Lecture du fichier…" : `${fileName} — prêt ✓`}</span>
                  </div>
                  <button onClick={() => { setFileContent(null); setFileName(null); setImageBase64(null); }} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Retirer</button>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">{fileName ? "Sujet précis (optionnel)" : "Sujet"}</label>
                <input value={quizSubject} onChange={(e) => setQuizSubject(e.target.value)}
                  placeholder={fileName ? "Précise un aspect particulier…" : "Ex: la photosynthèse, la 2e guerre mondiale…"}
                  className="bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors placeholder-gray-600 text-white" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Type de questions</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "qcm", label: "QCM", desc: "Choix multiples" },
                    { id: "developpement", label: "Développement", desc: "Réponse longue" },
                    { id: "mix", label: "Mix", desc: "Les deux" },
                  ].map((t) => (
                    <button key={t.id} onClick={() => setQuizType(t.id)}
                      className={`flex flex-col items-start px-3 py-2.5 rounded-xl text-sm border transition-all ${
                        quizType === t.id ? "border-blue-500 bg-blue-600/20 text-white" : "border-gray-700 bg-[#1a1a2e] text-gray-400 hover:border-gray-500 hover:text-white"
                      }`}>
                      <span className="font-medium text-xs">{t.label}</span>
                      <span className="text-xs opacity-60 mt-0.5">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Niveau de difficulté</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "general", label: "Général", desc: "Concepts de base" },
                    { id: "avance", label: "Avancé", desc: "Liens entre idées" },
                    { id: "precis", label: "Précis", desc: "Détails & chiffres" },
                    { id: "examen", label: "Examen", desc: "Pièges & analyse" },
                  ].map((d) => (
                    <button key={d.id} onClick={() => setQuizDifficulty(d.id)}
                      className={`flex flex-col items-start px-3 py-2.5 rounded-xl text-sm border transition-all ${
                        quizDifficulty === d.id ? "border-blue-500 bg-blue-600/20 text-white" : "border-gray-700 bg-[#1a1a2e] text-gray-400 hover:border-gray-500 hover:text-white"
                      }`}>
                      <span className="font-medium text-xs">{d.label}</span>
                      <span className="text-xs opacity-60 mt-0.5">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Nombre de questions</label>
                <div className="grid grid-cols-4 gap-2">
                  {["3", "5", "10", "15"].map((n) => (
                    <button key={n} onClick={() => setQuizNum(n)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${quizNum === n ? "bg-blue-600 text-white border border-blue-500" : "bg-[#1a1a2e] text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowQuiz(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl py-3 text-sm transition-colors text-gray-300">Annuler</button>
                <button onClick={handleGenerateQuiz} disabled={!currentId || pdfLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {pdfLoading ? "Lecture…" : "Générer"}
                </button>
              </div>
              {!currentId && <p className="text-red-400 text-xs text-center -mt-2">Crée un nouveau chat d'abord</p>}
            </div>
          </div>
        </div>
      )}

      {showFiche && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Créer une fiche de révision</h2>
              <button onClick={() => setShowFiche(false)} className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {fileName && <div className="text-blue-300 text-xs bg-blue-950 border border-blue-800 px-3 py-2 rounded-lg">Basé sur : {fileName}</div>}
            <input value={ficheSubject} onChange={(e) => setFicheSubject(e.target.value)}
              placeholder={fileName ? "Sujet précis (optionnel)" : "Matière (ex: la photosynthèse)"}
              className="bg-[#0f0f1a] border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors" />
            <div className="flex gap-2">
              <button onClick={() => setShowFiche(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl py-2.5 text-sm transition-colors">Annuler</button>
              <button onClick={handleGenerateFiche} disabled={!currentId} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium transition-colors">Créer</button>
            </div>
            {!currentId && <p className="text-red-400 text-xs text-center">Crée un nouveau chat d'abord</p>}
          </div>
        </div>
      )}

      {showResume && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Résumé automatique</h2>
              <button onClick={() => setShowResume(false)} className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {fileName
              ? <div className="text-blue-300 text-xs bg-blue-950 border border-blue-800 px-3 py-2 rounded-lg">Basé sur : {fileName}</div>
              : <p className="text-gray-400 text-sm">Upload d'abord un fichier avec le bouton 📄, puis clique Résumé.</p>
            }
            <div className="flex gap-2">
              <button onClick={() => setShowResume(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl py-2.5 text-sm transition-colors">Annuler</button>
              <button onClick={handleGenerateResume} disabled={!currentId || !fileName} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl py-2.5 text-sm font-medium transition-colors">Résumer</button>
            </div>
            {!currentId && <p className="text-red-400 text-xs text-center">Crée un nouveau chat d'abord</p>}
          </div>
        </div>
      )}
    </div>
  );
}