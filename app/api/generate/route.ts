import { NextResponse } from "next/server";

export const runtime = "nodejs";

const resourceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    outline: { type: "string" },
    scriptures: { type: "string" },
    devotional: { type: "string" },
    discussion: { type: "string" },
    social: { type: "string" }
  },
  required: ["summary", "outline", "scriptures", "devotional", "discussion", "social"]
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI is not configured yet. Add OPENAI_API_KEY in your Vercel project environment variables." },
      { status: 503 }
    );
  }

  let body: { title?: string; speaker?: string; date?: string; scripture?: string; transcript?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please send valid sermon details." }, { status: 400 });
  }

  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) return NextResponse.json({ error: "Paste a sermon transcript before generating resources." }, { status: 400 });
  if (transcript.length > 50000) return NextResponse.json({ error: "This MVP accepts transcripts up to 50,000 characters. Please split longer sermons into parts." }, { status: 413 });

  const prompt = `You are a careful sermon editorial assistant serving churches. Create six editable draft resources based ONLY on the sermon transcript and metadata below. Preserve the preacher's intended meaning and theological emphasis; do not add claims that are not supported by the transcript. Do not invent Bible references, quotations, anecdotes, or facts. In scriptures, list references explicitly present or clearly identifiable in the transcript, distinguish uncertain references, and say they require human verification. Do not reproduce long passages from copyrighted Bible translations. Every output must be a useful draft for a human editor, not a claim of final authority. Return valid JSON with exactly these string keys: summary, outline, scriptures, devotional, discussion, social. Use clear headings and line breaks within each string. The devotional and discussion questions must remain faithful to the sermon. Social content must not invent dates, church names, or calls to action.

SERMON TITLE: ${body.title || "Untitled sermon"}
SPEAKER: ${body.speaker || "Not supplied"}
DATE: ${body.date || "Not supplied"}
USER-SUPPLIED SCRIPTURE REFERENCES: ${body.scripture || "None supplied"}

TRANSCRIPT:
${transcript}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sermon_resources",
            strict: true,
            schema: resourceSchema
          }
        },
        messages: [
          { role: "system", content: "Return only the requested structured JSON. Faithfulness to the supplied sermon is more important than creativity." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || "The AI provider could not complete this request.";
      return NextResponse.json({ error: message }, { status: response.status === 429 ? 429 : 502 });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "The AI provider returned an empty response. Please try again." }, { status: 502 });
    const resources = JSON.parse(content);
    for (const key of Object.keys(resourceSchema.properties)) {
      if (typeof resources[key] !== "string") {
        return NextResponse.json({ error: "The AI response was incomplete. Please try again." }, { status: 502 });
      }
    }
    return NextResponse.json({ resources });
  } catch {
    return NextResponse.json({ error: "Could not reach the AI service. Check your connection and try again." }, { status: 502 });
  }
}
