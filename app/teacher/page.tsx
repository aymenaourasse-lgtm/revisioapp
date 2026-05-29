"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange, logOut } from "../auth";

export default function TeacherPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (!user) {
        router.push("/login");
      } else {
        setEmail(user.email ?? "");
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-blue-400 text-3xl font-bold">Révisio IA</h1>
      <p className="text-gray-400 text-sm">Tableau de bord enseignant</p>
      <div className="bg-[#111827] rounded-2xl p-8 w-full max-w-lg flex flex-col gap-4">
        <p className="text-gray-300 text-sm">Connecté en tant que : <span className="text-white font-medium">{email}</span></p>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="bg-[#1e293b] rounded-xl p-4 flex flex-col gap-1">
            <span className="text-2xl font-bold text-blue-400">0</span>
            <span className="text-gray-400 text-xs">Élèves</span>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-4 flex flex-col gap-1">
            <span className="text-2xl font-bold text-blue-400">0</span>
            <span className="text-gray-400 text-xs">Quiz créés</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs text-center mt-2">Fonctionnalités enseignant bientôt disponibles</p>
      </div>
      <button
        onClick={handleLogout}
        className="text-gray-500 hover:text-red-400 text-sm"
      >
        Se déconnecter
      </button>
    </div>
  );
}