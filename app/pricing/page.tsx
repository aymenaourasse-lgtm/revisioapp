"use client";

import { useRouter } from "next/navigation";
import { onAuthChange } from "../auth";
import { useState, useEffect } from "react";

export default function PricingPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthChange((user: any) => {
      setUserEmail(user?.email ?? null);
    });
    return () => unsub();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!userEmail) { router.push("/signup"); return; }
    setLoading(priceId);
    const res = await fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, email: userEmail }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(null);
  };

  const plans = [
    {
      name: "Gratuit",
      badge: "Élève / Enseignant",
      sub: "Pour commencer",
      price: null,
      description: "Découvre Révisio IA sans engagement",
      features: ["10 messages par jour", "Chat IA de base", "Historique limité"],
      priceId: null,
      cta: "Commencer maintenant",
      highlight: false,
    },
    {
      name: "Élève Pro",
      badge: null,
      sub: "Le plus populaire",
      price: "9.99",
      description: "Pour les élèves sérieux",
      features: ["Messages illimités", "Quiz automatiques", "Fiches de révision", "Upload de fichiers", "Analyse de photos", "Historique complet"],
      priceId: process.env.NEXT_PUBLIC_STRIPE_STUDENT_PRICE_ID,
      cta: "Passer Pro",
      highlight: true,
    },
    {
      name: "Enseignant Pro",
      badge: null,
      sub: "Pour les classes",
      price: "14.99",
      description: "Pour les enseignants",
      features: ["Tout ce qu'inclut Élève Pro", "Tableau de bord enseignant", "Gestion des élèves", "Statistiques de classe", "Support prioritaire"],
      priceId: process.env.NEXT_PUBLIC_STRIPE_TEACHER_PRICE_ID,
      cta: "Pour ma classe",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white" style={{fontFamily: "system-ui, sans-serif"}}>

      <header className="flex justify-between items-center px-8 py-5 border-b border-gray-800 sticky top-0 bg-[#0f0f1a] z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span className="text-white font-semibold text-sm">Révisio IA</span>
        </div>
        <button onClick={() => router.push(userEmail ? "/student" : "/login")}
          className="text-gray-400 hover:text-white text-sm transition-colors">
          {userEmail ? "Tableau de bord" : "Se connecter"}
        </button>
      </header>

      <div className="text-center py-16 px-6">
        <div className="inline-flex items-center gap-2 bg-blue-950 border border-blue-800 text-blue-300 text-xs px-3 py-1.5 rounded-full mb-6">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#60a5fa" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Paiements 100% sécurisés par Stripe
        </div>
        <h1 className="text-4xl font-bold mb-3">Choisis ton forfait</h1>
        <p className="text-gray-400 text-lg">Commence gratuitement, évolue quand tu es prêt</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-3 gap-6 items-center">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative rounded-2xl p-6 flex flex-col gap-5 border transition-all ${
            plan.highlight
              ? "bg-gradient-to-b from-blue-600 to-blue-700 border-blue-400 shadow-2xl shadow-blue-900/50 scale-105 z-10"
              : "bg-[#111827] border-gray-800 hover:border-gray-700"
          }`}>
            {plan.highlight && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-xs px-4 py-1 rounded-full font-bold shadow-lg">
                ⭐ Populaire
              </div>
            )}
            {plan.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gray-700 text-gray-200 text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap">
                {plan.badge}
              </div>
            )}
            <div>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${plan.highlight ? "text-blue-200" : "text-gray-500"}`}>{plan.sub}</p>
              <h2 className="text-lg font-bold">{plan.name}</h2>
              <p className={`text-sm mt-1 ${plan.highlight ? "text-blue-100" : "text-gray-500"}`}>{plan.description}</p>
            </div>
            <div className={`h-px w-full ${plan.highlight ? "bg-blue-500" : "bg-gray-800"}`}></div>
            <div className="flex items-baseline gap-1">
              {plan.price ? (
                <>
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-gray-500"}`}>/mois</span>
                </>
              ) : (
                <span className="text-4xl font-black text-white">0$</span>
              )}
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? "bg-white/20" : "bg-blue-900"}`}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "white" : "#60a5fa"} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className={plan.highlight ? "text-white" : "text-gray-300"}>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => plan.priceId ? handleSubscribe(plan.priceId) : router.push(userEmail ? "/student" : "/signup")}
              disabled={!!loading && loading === plan.priceId}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                plan.highlight
                  ? "bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              } disabled:opacity-50`}
            >
              {loading === plan.priceId ? "Chargement..." : plan.cta} →
            </button>
          </div>
        ))}
      </div>

      <div className="text-center pb-16 px-6">
        <div className="inline-flex items-center gap-6 bg-[#111827] border border-gray-800 rounded-2xl px-8 py-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Annulation à tout moment
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Paiement sécurisé
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Support prioritaire Pro
          </div>
        </div>
      </div>

      <footer className="text-center text-gray-600 text-xs py-6 border-t border-gray-800">
        © 2025 Révisio IA — Paiements sécurisés par Stripe
      </footer>
    </div>
  );
}