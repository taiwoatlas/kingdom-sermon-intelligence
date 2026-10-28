import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg", "flac"]);

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return errorResponse(503, "AI_PROVIDER_NOT_CONFIGURED", "Audio/video transcription needs the server-side GROQ_API_KEY configured in Vercel.");

  let form: FormData;
  try { form = await request.formData(); }
  catch { return errorResponse(400, "INVALID_FORM", "Upload an audio or video file to transcribe."); }

  const file = form.get("file");
  if (!(file instanceof File)) return errorResponse(400, "FILE_REQUIRED", "Choose an audio or video file first.");
  if (file.size === 0) return errorResponse(400, "EMPTY_FILE", "The selected file is empty.");
  if (file.size > MAX_FILE_BYTES) return errorResponse(413, "FILE_TOO_LARGE", "This transcription endpoint accepts files up to 25 MB. Use a shorter or compressed file.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.has(extension)) return errorResponse(415, "UNSUPPORTED_FILE", "Supported formats: MP3, M4A, WAV, WEBM, OGG, FLAC, MP4 and MPEG audio.");

  try {
    const payload = new FormData();
    payload.append("file", file, file.name);
    payload.append("model", "whisper-large-v3-turbo");
    payload.append("response_format", "json");
    payload.append("temperature", "0");
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey },
      body: payload,
      signal: AbortSignal.timeout(55000),
    });
    if (!response.ok) {
      if (response.status === 429) return errorResponse(429, "FREE_LIMIT_REACHED", "The Groq free transcription limit was reached. Wait and try again; this app will not switch to paid usage automatically.");
      if (response.status === 401 || response.status === 403) return errorResponse(502, "AI_PROVIDER_AUTH_ERROR", "Groq rejected the configured API key. Check GROQ_API_KEY in Vercel.");
      const detail = await response.text().catch(() => "");
      return errorResponse(502, "TRANSCRIPTION_FAILED", detail.slice(0, 250) || "The transcription service could not process this file.");
    }
    const result = await response.json() as { text?: unknown };
    if (typeof result.text !== "string" || !result.text.trim()) return errorResponse(502, "EMPTY_TRANSCRIPT", "No speech transcript was returned for this file.");
    return NextResponse.json({ transcript: result.text, filename: file.name });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") return errorResponse(504, "TRANSCRIPTION_TIMEOUT", "Transcription took too long. Try a shorter file.");
    return errorResponse(502, "TRANSCRIPTION_UNAVAILABLE", "Could not reach the transcription service. Check your connection and retry.");
  }
}
