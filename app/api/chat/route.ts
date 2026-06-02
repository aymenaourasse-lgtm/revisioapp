import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { messages, mode, subject, numQuestions, fileContent, imageBase64 } = await request.json();

  let systemPrompt = "Tu es Revisio IA, un assistant scolaire. Reponds toujours en francais. Explique simplement et etape par etape.";

  if (fileContent) {
    systemPrompt += `\n\nL'eleve a fourni ses notes. Voici le contenu :\n\n${fileContent}\n\nBase tes reponses sur ce contenu.`;
  }

  if (mode === "quiz") {
    const base = fileContent ? "le contenu des notes fourni" : subject;
    systemPrompt = `Tu es Revisio IA. Genere un quiz de ${numQuestions} questions sur : ${base}.

Reponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans backticks, sans texte avant ou apres.
Format exact :
[
  {
    "question": "Question ici ?",
    "options": ["Reponse A", "Reponse B", "Reponse C", "Reponse D"],
    "correct": 0
  }
]
"correct" est l index (0,1,2,3) de la bonne reponse dans options.
Genere exactement ${numQuestions} questions.`;
  }

  if (mode === "fiche") {
    const base = fileContent ? "le contenu des notes fourni" : subject;
    systemPrompt = `Tu es Revisio IA. Genere une fiche de revision complete sur : ${base}.

Format exact a respecter :

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