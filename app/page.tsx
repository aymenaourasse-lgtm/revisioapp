export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      <h1 className="text-6xl font-bold mb-6 text-center">
        Revisio IA
      </h1>

      <p className="text-xl text-gray-300 text-center max-w-2xl mb-10">
        La plateforme IA intelligente dédiée aux étudiants et aux professeurs.
        Révisions, devoirs, examens, corrections et assistance scolaire complète.
      </p>

      <div className="flex gap-6">

        <a
  href="/student"
  className="bg-white text-black px-8 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition"
>
  Espace Étudiant
</a>

<a
  href="/teacher"
  className="border border-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-black transition"
>
  Espace Professeur
</a>

      </div>

    </main>
  );
}