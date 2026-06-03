import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { messages, mode, subject, numQuestions, fileContent, imageBase64, difficulty, questionType, studentAnswer, question } = await request.json();

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
      mix: `Alterne entre QCM et developpement. Environ la moitie des questions de chaque type selon le niveau. Pour le niveau general/avance, plus de QCM. Pour precis/examen, plus de developpement.`,
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
    systemPrompt = `Tu es Revisio IA. Genere une fiche de revision complete sur : ${base}.

Format exact :

FICHE DE REVISION : [TITRE EN MAJUSCULES]

DEFINITION :
[definition claire en 2-3 phrases]

POINTS CLES :
- [point 1]
- [point 2]
- [point 3]
- [point 4]
- [point 5]

A RETENIR :
[resume de 3-4 phrases essentielles]

MOTS CLES :
[mot1], [mot2], [mot3], [mot4], [mot5]

Genere uniquement la fiche, rien d'autre.`;
  }

  if (mode === "resume") {
    const base = fileContent ? "le contenu des notes fourni" : "mes notes";
    systemPrompt = `Tu es Revisio IA. Fais un resume structure et detaille de : ${base}.

Format exact :

RESUME : [TITRE EN MAJUSCULES]

INTRODUCTION :
[2-3 phrases de contexte]

POINTS PRINCIPAUX :
1. [point 1]
2. [point 2]
3. [point 3]
4. [point 4]
5. [point 5]

CONCLUSION :
[2-3 phrases de synthese]

Genere uniquement le resume, rien d'autre.`;
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
    max_tokens: 2000,
  });

  return Response.json({
    reply: response.choices[0].message.content,
  });
}