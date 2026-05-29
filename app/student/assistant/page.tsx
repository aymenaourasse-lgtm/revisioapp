"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection, addDoc, getDocs,
  updateDoc, doc, orderBy, query,
  serverTimestamp, where
} from "firebase/firestore";
import { db } from "../../firestore";
import { logOut, onAuthChange } from "../../auth";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

export default function StudentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((user: any) => {
      if (!user) {
        router.push("/login");
      } else {
        setUserId(user.uid);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const loadConversations = async () => {
      const q = query(
        collection(db, "conversations"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        messages: d.data().messages ?? [],
      }));
      setConversations(data);
    };
    loadConversations();
  }, [userId]);

  const handleNewChat = async () => {
    if (!userId) return;
    const docRef = await addDoc(collection(db, "conversations"), {
      title: "Nouveau chat",
      messages: [],
      createdAt: serverTimestamp(),
      userId,
    });
    const newConv: Conversation = {
      id: docRef.id,
      title: "Nouveau chat",
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentId(docRef.id);
    setMessages([]);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentId) return;
    const userMsg: Message = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updated }),
    });
    const data = await res.json();
    const aiMsg: Message = { role: "assistant", content: data.reply };
    const final = [...updated, aiMsg];
    setMessages(final);
    setLoading(false);
    const title = userMsg.content.slice(0, 40);
    await updateDoc(doc(db, "conversations", currentId), { messages: final, title });
    setConversations((prev) =>
      prev.map((c) => c.id === currentId ? { ...c, messages: final, title } : c)
    );
  };

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[#0f0f1a] text-white">
      <aside className="w-64 bg-[#111827] flex flex-col p-4 gap-3">
        <h1 className="text-blue-400 font-semibold text-lg">Révisio IA</h1>
        <button onClick={handleNewChat} className="bg-blue-600 hover:bg-blue-700 rounded-lg py-2 text-sm">
          + Nouveau chat
        </button>
        <div className="flex flex-col gap-1 mt-2 overflow-y-auto flex-1">
          {conversations.map((c) => (
            <button key={c.id}
              onClick={() => { setCurrentId(c.id); setMessages(c.messages); }}
              className={`text-left text-sm px-3 py-2 rounded-lg truncate ${currentId === c.id ? "bg-blue-900 text-white" : "text-gray-400 hover:bg-gray-800"}`}>
              {c.title}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm py-2">
          Se déconnecter
        </button>
      </aside>
      <main className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-xl px-4 py-3 rounded-2xl text-sm ${m.role === "user" ? "self-end bg-blue-600" : "self-start bg-[#1e293b]"}`}>
              {m.content}
            </div>
          ))}
          {loading && <div className="self-start bg-[#1e293b] px-4 py-3 rounded-2xl text-sm text-gray-400">Révisio réfléchit…</div>}
        </div>
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={currentId ? "Pose ta question…" : "Crée un nouveau chat d'abord"}
            disabled={!currentId}
            className="flex-1 bg-[#1e293b] rounded-xl px-4 py-3 text-sm outline-none" />
          <button onClick={handleSend} disabled={!currentId || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-5 rounded-xl text-sm">
            Envoyer
          </button>
        </div>
      </main>
    </div>
  );
}