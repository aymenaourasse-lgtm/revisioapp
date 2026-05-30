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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [flashcardCount, setFlashcardCount] = useState(0);
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
      setFlashcardCount(fSnap.size);
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
    if (res.ok) {
      alert("Abonnement annulé.");
      router.refresh();
    }
  };

  const planLabel = () => {
    if (userData?.plan === "pro_student") return { label: "Élève Pro", color: "bg-blue-600" };
    if (userData?.plan === "pro_teacher") return { label: "Enseignant Pro", color: "bg-purple-600" };
    return { label: "Gratuit", color: "bg-gray-600" };
  };

  if (loading) return (
    <div className="flex h-screen bg-[#0d0d14] items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const plan = planLabel();

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
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <h2 className="text-2xl font-semibold">Mon profil</h2>

          {/* Infos */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{user?.displayName || "Utilisateur"}</p>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
              <span className={"ml-auto px-3 py-1 rounded-full text-xs font-medium " + plan.color}>{plan.label}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Messages aujourd'hui</p>
              <p className="text-3xl font-bold">{userData?.messageCount ?? 0}</p>
              <p className="text-gray-500 text-xs mt-1">{userData?.plan === "free" ? "sur 10" : "illimité"}</p>
            </div>
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Sets de flashcards</p>
              <p className="text-3xl font-bold">{flashcardCount}</p>
              <p className="text-gray-500 text-xs mt-1">créés</p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Sécurité</h3>
            <button onClick={handlePasswordReset} disabled={resetSent} className="flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-xl text-sm transition-colors">
              <span>{resetSent ? "Email envoyé ✓" : "Changer le mot de passe"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {userData?.plan !== "free" && userData?.plan && (
              <>
                <h3 className="text-sm font-semibold text-gray-300 mt-2 mb-1">Abonnement</h3>
                <button onClick={handleCancelSubscription} className="flex items-center justify-between px-4 py-3 bg-red-950 hover:bg-red-900 border border-red-800 rounded-xl text-sm text-red-300 transition-colors">
                  <span>Annuler l'abonnement</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </>
            )}

            {(!userData?.plan || userData?.plan === "free") && (
              <>
                <h3 className="text-sm font-semibold text-gray-300 mt-2 mb-1">Passer Pro</h3>
                <button onClick={() => router.push("/pricing")} className="flex items-center justify-between px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition-colors">
                  <span>Voir les offres Pro</span>
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