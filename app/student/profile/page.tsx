"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db } from "../../firestore";
import { getAuth } from "firebase/auth";
import { app } from "../../firebase";
const auth = getAuth(app);
import { onAuthChange } from "../../auth";

const FREE_MSG_LIMIT = 50;
const FREE_FLASH_LIMIT = 10;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [flashcardSetCount, setFlashcardSetCount] = useState(0);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (u: any) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) setUserData(snap.data());
      const q = query(collection(db, "flashcard_sets"), where("userId", "==", u.uid));
      const fSnap = await getDocs(q);
      setFlashcardSetCount(fSnap.size);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    await sendPasswordResetEmail(auth, user.email);
    setResetSent(true);
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Annuler votre abonnement ?")) return;
    const res = await fetch("/api/stripe/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.uid }),
    });
    if (res.ok) { alert("Abonnement annulé."); router.refresh(); }
  };

  const isPro = userData?.plan === "pro" || userData?.plan === "pro_student" || userData?.plan === "pro_teacher";
  const today = new Date().toDateString();
  const msgCount = userData?.lastMessageDate === today ? (userData?.messageCount ?? 0) : 0;
  const flashCount = userData?.lastFlashcardDate === today ? (userData?.flashcardCount ?? 0) : 0;

  const planInfo = () => {
    if (userData?.plan === "pro_teacher") return { label: "Enseignant Pro", color: "bg-purple-600", text: "text-purple-300", border: "border-purple-700" };
    if (userData?.plan === "pro" || userData?.plan === "pro_student") return { label: "Élève Pro", color: "bg-blue-600", text: "text-blue-300", border: "border-blue-700" };
    return { label: "Gratuit", color: "bg-gray-700", text: "text-gray-300", border: "border-gray-600" };
  };

  const plan = planInfo();
  const initials = user?.email?.[0]?.toUpperCase() ?? "?";

  if (loading) return (
    <div className="flex h-screen bg-[#0d0d14] items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

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
              <p className="text-gray-500 text-xs">Profil</p>
            </div>
          </div>
        </div>
        <div className="p-3 flex flex-col gap-1">
          <button onClick={() => router.push("/student")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Chat IA
          </button>
          <button onClick={() => router.push("/student/flashcards")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Flashcards
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profil
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">

          {/* Header */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-lg">{user?.displayName || user?.email?.split("@")[0]}</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.color}`}>{plan.label}</span>
                </div>
                <p className="text-gray-400 text-sm mt-0.5">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Messages aujourd'hui</p>
              </div>
              <p className="text-3xl font-bold">{msgCount}</p>
              {!isPro && (
                <>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${msgCount / FREE_MSG_LIMIT > 0.8 ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${Math.min((msgCount / FREE_MSG_LIMIT) * 100, 100)}%` }}></div>
                  </div>
                  <p className="text-gray-500 text-xs">{FREE_MSG_LIMIT - msgCount} restants aujourd'hui</p>
                </>
              )}
              {isPro && <p className="text-blue-400 text-xs">Illimité ✓</p>}
            </div>

            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Flashcards générées</p>
              </div>
              <p className="text-3xl font-bold">{flashCount}</p>
              {!isPro && (
                <>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${flashCount / FREE_FLASH_LIMIT > 0.8 ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${Math.min((flashCount / FREE_FLASH_LIMIT) * 100, 100)}%` }}></div>
                  </div>
                  <p className="text-gray-500 text-xs">{FREE_FLASH_LIMIT - flashCount} restantes aujourd'hui</p>
                </>
              )}
              {isPro && <p className="text-blue-400 text-xs">Illimité ✓</p>}
            </div>

            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Sets de flashcards</p>
              </div>
              <p className="text-3xl font-bold">{flashcardSetCount}</p>
              <p className="text-gray-500 text-xs">sets créés au total</p>
            </div>

            <div className={`bg-[#1a1a2e] border ${plan.border} rounded-2xl p-5 flex flex-col gap-3`}>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Abonnement</p>
              </div>
              <p className={`text-lg font-bold ${plan.text}`}>{plan.label}</p>
              {!isPro && <p className="text-gray-500 text-xs">Passe à Pro pour tout débloquer</p>}
              {isPro && <p className="text-blue-400 text-xs">Accès complet ✓</p>}
            </div>
          </div>

          {/* Upgrade banner pour gratuits */}
          {!isPro && (
            <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 border border-blue-700 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">Passe à Élève Pro 🚀</p>
                <p className="text-gray-400 text-xs mt-0.5">Messages illimités, flashcards illimitées, accès complet</p>
              </div>
              <button onClick={() => router.push("/pricing")} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0">
                9.99$/mois →
              </button>
            </div>
          )}

          {/* Sécurité & abonnement */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-300">Sécurité</h3>
            <button onClick={handlePasswordReset} disabled={resetSent} className="flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-xl text-sm transition-colors">
              <span>{resetSent ? "Email envoyé ✓" : "Changer le mot de passe"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {isPro && (
              <>
                <h3 className="text-sm font-semibold text-gray-300 mt-2">Abonnement</h3>
                <button onClick={handleCancelSubscription} className="flex items-center justify-between px-4 py-3 bg-red-950 hover:bg-red-900 border border-red-800 rounded-xl text-sm text-red-300 transition-colors">
                  <span>Annuler l'abonnement</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}