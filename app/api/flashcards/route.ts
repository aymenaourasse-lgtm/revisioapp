import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { subject, numCards = 5 } = await req.json();
  const prompt = "Generate " + numCards + " flashcards about " + (subject || "general knowledge");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Return ONLY a JSON array of objects with front and back keys. No markdown.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
    }),
  });

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "[]";

  try {
    const cards = JSON.parse(text.trim());
    return Response.json({ cards });
  } catch (e) {
    return Response.json({ cards: [] });
  }
}
