import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { messages, mode, subject, numQuestions, fileContent, imageBase64, difficulty, questionType, studentAnswer, question, resumeMode } = await request.json();

  let systemPrompt = "Tu es Revisio IA, un assistant scolaire. Reponds toujours en francais. Explique simplement et etape par etape.";

  if (fileContent) {
    systemPrompt += `\n\nL'eleve a fourni ses notes. Voici le contenu :\n\n${fileContent}\n\nBase tes reponses sur ce contenu.`;
  }

  if (mode === "quiz_correction") {
    systemPrompt = `Tu es Revisio IA, un correcteur scolaire expert. Corrige la reponse de l'eleve a la question suivante.

Question : ${question}
Reponse de l'eleve : ${studentAnswer}

Reponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks.
Format exact :
{
  "note": 85,
  "appreciation": "Bien",
  "commentaire": "Explication detaillee de ce qui est bon et ce qui manque.",
  "correction": "La reponse ideale complete."
}

"note" est un nombre entre 0 et 100.
"appreciation" est un mot : Excellent, Tres bien, Bien, Passable, Insuffisant.
"commentaire" explique les points forts et les points a ameliorer.
"correction" donne la reponse complete et ideale.`;

    const res = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Corrige cette reponse." },
      ],
      max_tokens: 1000,
    });
    return Response.json({ reply: res.choices[0].message.content });
  }

  if (mode === "quiz") {
    const base = fileContent ? "le contenu des notes fourni" : subject;
    const difficultyInstructions: Record<string, string> = {
      general: `NIVEAU GENERAL : Questions simples sur les concepts de base. Vocabulaire accessible.`,
      avance: `NIVEAU AVANCE : Questions sur des concepts plus approfondis. Liens entre les idees.`,
      precis: `NIVEAU PRECIS : Questions tres specifiques avec des details precis (chiffres, dates, mecanismes).`,
      examen: `NIVEAU EXAMEN : Questions complexes comme un vrai examen. Pieges subtils. Comprehension profonde.`,
    };
    const typeInstructions: Record<string, string> = {
      qcm: `Toutes les questions sont de type QCM avec 4 choix de reponse. Le champ "type" vaut "qcm".`,
      developpement: `Toutes les questions sont de type developpement (reponse longue a ecrire). Le champ "type" vaut "dev". Pas de champ "options" ni "correct". Inclure un champ "reponse_ideale" avec la reponse complete attendue.`,
      mix: `Alterne entre QCM et developpement. Environ la moitie des questions de chaque type selon le niveau.`,
    };
    const diffLevel = difficultyInstructions[difficulty ?? "general"];
    const typeLevel = typeInstructions[questionType ?? "qcm"];
    systemPrompt = `Tu es Revisio IA. Genere un quiz de ${numQuestions} questions sur : ${base}.

${diffLevel}
${typeLevel}

${fileContent ? `IMPORTANT: Tu dois baser TOUTES tes questions UNIQUEMENT sur le contenu suivant:\n\n${fileContent}` : ""}

Reponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans backticks.
Format pour QCM :
{
  "type": "qcm",
  "question": "Question ?",
  "options": ["A", "B", "C", "D"],
  "correct": 0,
  "explanation": "Explication courte."
}
Format pour developpement :
{
  "type": "dev",
  "question": "Question de developpement ?",
  "reponse_ideale": "Reponse complete attendue."
}

Genere exactement ${numQuestions} questions sous forme de tableau JSON.`;
  }

  if (mode === "fiche") {
    const base = fileContent ? "le contenu des notes fourni" : subject;
    systemPrompt = `Tu es Revisio IA, un assistant scolaire quebecois expert. Genere une fiche de revision claire, precise et adaptee aux etudiants du secondaire, cegep ou universite sur : ${base}.
${fileContent ? `Base-toi UNIQUEMENT sur ce contenu:\n\n${fileContent}` : ""}

Reponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks.
Format exact :
{
  "titre": "TITRE COURT EN MAJUSCULES",
  "sujet": "Nom du sujet",
  "definition": "Definition claire et simple en 2-3 phrases. Utilise un langage accessible mais precis. Si possible, donne un exemple concret dans la definition.",
  "points_cles": [
    { "titre": "Nom du concept", "contenu": "Explication detaillee en 2-3 phrases simples. Inclure un exemple concret ou un chiffre precis si disponible." },
    { "titre": "Nom du concept", "contenu": "Explication detaillee en 2-3 phrases simples. Inclure un exemple concret ou un chiffre precis si disponible." },
    { "titre": "Nom du concept", "contenu": "Explication detaillee en 2-3 phrases simples. Inclure un exemple concret ou un chiffre precis si disponible." },
    { "titre": "Nom du concept", "contenu": "Explication detaillee en 2-3 phrases simples. Inclure un exemple concret ou un chiffre precis si disponible." },
    { "titre": "Nom du concept", "contenu": "Explication detaillee en 2-3 phrases simples. Inclure un exemple concret ou un chiffre precis si disponible." }
  ],
  "a_retenir": "3-4 phrases essentielles qui resument les points les plus importants. Ce que l'etudiant DOIT absolument savoir pour un examen.",
  "mots_cles": ["terme1", "terme2", "terme3", "terme4", "terme5", "terme6"],
  "questions_revision": [
    { "question": "Question directe et claire ?", "reponse": "Reponse courte, precise et complete en 1-2 phrases." },
    { "question": "Question directe et claire ?", "reponse": "Reponse courte, precise et complete en 1-2 phrases." },
    { "question": "Question directe et claire ?", "reponse": "Reponse courte, precise et complete en 1-2 phrases." },
    { "question": "Question directe et claire ?", "reponse": "Reponse courte, precise et complete en 1-2 phrases." },
    { "question": "Question directe et claire ?", "reponse": "Reponse courte, precise et complete en 1-2 phrases." }
  ]
}

Regles importantes :
- Utilise un vocabulaire adapte aux etudiants (secondaire/cegep/universite)
- Chaque point cle doit avoir un titre court et un contenu clair
- Les questions de revision doivent couvrir les points les plus importants
- Si le contenu fourni contient des chiffres ou formules, inclus-les precisement
- Ecris toujours en francais quebecois standard`;
  }

  if (mode === "resume") {
    const base = fileContent
      ? subject ? `la partie sur "${subject}" dans le contenu fourni` : "le contenu complet des notes fourni"
      : subject || "mes notes";

    const isDetailed = resumeMode === "precis";

    systemPrompt = isDetailed
      ? `Tu es Revisio IA, un assistant scolaire quebecois expert. Fais un resume EXTREMEMENT PRECIS et DETAILLE de : ${base}.

${fileContent ? `Voici le contenu COMPLET. Couvre CHAQUE concept, CHAQUE chiffre, CHAQUE detail sans rien omettre:\n\n${fileContent}` : ""}
${subject ? `\nFOCUS : L'eleve veut un resume particulierement detaille sur : "${subject}".` : ""}

IMPORTANT : Ce resume doit etre exhaustif. L'etudiant doit pouvoir etudier UNIQUEMENT avec ce resume.

Format exact :

RESUME PRECIS : [TITRE EN MAJUSCULES]

INTRODUCTION :
[3-4 phrases de contexte general]

[Pour CHAQUE section ou concept du document, cree un bloc :]

[TITRE DE LA SECTION EN MAJUSCULES] :
[Explication complete et detaillee en 4-6 phrases. Inclure tous les details importants, chiffres, definitions, exemples concrets, mecanismes expliques etape par etape.]

[Repete ce bloc pour CHAQUE concept important]

POINTS ESSENTIELS A RETENIR :
- [Point 1 avec detail precis]
- [Point 2 avec detail precis]
- [Point 3 avec detail precis]
- [Autant de points que necessaire]

CONCLUSION :
[3-4 phrases de synthese qui relient tous les concepts]

Ecris en francais. Sois exhaustif. Ne raccourcis rien.`
      : `Tu es Revisio IA, un assistant scolaire quebecois expert. Fais un resume GENERAL et CLAIR de : ${base}.

${fileContent ? `Voici le contenu a resumer. Couvre les grandes idees principales:\n\n${fileContent}` : ""}
${subject ? `\nFOCUS : Resume particulierement la partie sur : "${subject}".` : ""}

Format exact :

RESUME GENERAL : [TITRE EN MAJUSCULES]

INTRODUCTION :
[2-3 phrases de contexte general qui expliquent le sujet]

GRANDES IDEES :
1. [Idee principale 1 — 2-3 phrases simples et claires]
2. [Idee principale 2 — 2-3 phrases simples et claires]
3. [Idee principale 3 — 2-3 phrases simples et claires]
4. [Idee principale 4 — 2-3 phrases simples et claires]
5. [Idee principale 5 — 2-3 phrases simples et claires]
[Ajoute d'autres idees si necessaire]

A RETENIR :
[3-4 phrases qui resument l'essentiel du document]

CONCLUSION :
[2-3 phrases de synthese]

Ecris en francais. Sois clair et accessible.`;
  }

  let apiMessages: any[];

  if (imageBase64) {
    apiMessages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageBase64 } },
          { type: "text", text: messages[messages.length - 1]?.content ?? "Explique ce que tu vois sur cette image." },
        ],
      },
    ];
  } else if (mode === "quiz" || mode === "fiche" || mode === "resume") {
    apiMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: mode === "quiz" ? "Genere un quiz" : mode === "fiche" ? "Genere une fiche de revision" : "Genere un resume" },
    ];
  } else {
    apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];
  }

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: apiMessages,
    max_tokens: 4000,
  });

  return Response.json({
    reply: response.choices[0].message.content,
  });
}