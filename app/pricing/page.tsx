"use client";

import { useRouter } from "next/navigation";
import { auth, onAuthChange } from "../auth";
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
    if (!userEmail) {
      router.push("/signup");
      return;
    }
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
      price: "0",
      description: "Pour découvrir Révisio IA",
      features: [
        "10 messages par jour",
        "Chat IA de base",
        "Historique limité",
      ],
      priceId: null,
      cta: "Commencer gratuitement",
      highlight: false,
    },
    {
      name: "Élève Pro",
      price: "9.99",
      description: "Pour les élèves sérieux",
      features: [
        "Messages illimités",
        "Quiz automatiques",
        "Fiches de révision",
        "Upload de fichiers",
        "Analyse de photos",
        "Historique complet",
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_STUDENT_PRICE_ID,
      cta: "S'abonner",
      highlight: true,
    },
    {
      name: "Enseignant Pro",
      price: "14.99",
      description: "Pour les enseignants",
      features: [
        "Tout ce qu'inclut Élève Pro",
        "Tableau de bord enseignant",
        "Gestion des élèves",
        "Statistiques de classe",
        "Support prioritaire",
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_TEACHER_PRICE_ID,
      cta: "S'abonner",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white" style={{fontFamily: "system-ui, sans-serif"}}>

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-gray-800">
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

      {/* Hero */}
      <div className="text-center py-16 px-6">
        <h1 className="text-4xl font-bold mb-3">Choisis ton forfait</h1>
        <p className="text-gray-400 text-lg">Commence gratuitement, évolue quand tu es prêt</p>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative bg-[#111827] rounded-2xl p-6 flex flex-col gap-4 border ${plan.highlight ? "border-blue-600" : "border-gray-800"}`}>
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                Populaire
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-gray-500 text-sm">/mois</span>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => plan.priceId ? handleSubscribe(plan.priceId) : router.push("/signup")}
              disabled={loading === plan.priceId}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${plan.highlight ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-800 hover:bg-gray-700"} disabled:opacity-50`}
            >
              {loading === plan.priceId ? "Chargement..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-600 text-xs py-6 border-t border-gray-800">
        © 2025 Révisio IA — Paiements sécurisés par Stripe
      </footer>
    </div>
  );
}