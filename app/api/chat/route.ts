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

Format exact :
Question 1 : [question]
A) [reponse]
B) [reponse]
C) [reponse]
D) [reponse]
Reponse correcte : [lettre]

Genere exactement ${numQuestions} questions. Rien d'autre.`;
  }

  let apiMessages: any[];

  if (imageBase64) {
    apiMessages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageBase64 },
          },
          {
            type: "text",
            text: messages[messages.length - 1]?.content ?? "Explique ce que tu vois sur cette image.",
          },
        ],
      },
    ];
  } else if (mode === "quiz") {
    apiMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Genere un quiz" },
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