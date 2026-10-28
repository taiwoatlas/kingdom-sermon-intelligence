import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return fail(503, "ART_PROVIDER_NOT_CONFIGURED", "AI artwork is not connected yet. Add REPLICATE_API_TOKEN as a server-only environment variable in Vercel. Your text carousel will continue to work without it.");
  }

  let body: unknown;
  try { body = await request.json(); } catch { return fail(400, "INVALID_JSON", "Provide slide details as JSON."); }
  if (!body || typeof body !== "object") return fail(400, "INVALID_INPUT", "Provide a slide to illustrate.");
  const input = body as Record<string, unknown>;
  const clean = (v: unknown, max: number) => typeof v === "string" ? v.trim().slice(0, max) : "";
  const title = clean(input.title, 180);
  const headline = clean(input.headline, 240);
  const text = clean(input.body, 700);
  const direction = clean(input.visualDirection, 900);
  const style = clean(input.designStyle, 40);
  const backgroundColor = /^#[0-9a-f]{6}$/i.test(clean(input.backgroundColor, 7)) ? clean(input.backgroundColor, 7) : "#f4efe6";
  const accentColor = /^#[0-9a-f]{6}$/i.test(clean(input.accentColor, 7)) ? clean(input.accentColor, 7) : "#b6422e";
  if (!headline || !text) return fail(400, "SLIDE_REQUIRED", "A slide headline and message are required to create artwork.");

  const prompt = [
    "Create a sophisticated art-directed background illustration for one Instagram carousel slide, portrait 4:5 composition.",
    "This is editorial artwork behind text that will be added later. DO NOT render any words, letters, typography, logos, watermarks, numbers or text-like marks.",
    "Make a specific, memorable visual metaphor for the meaning below, not generic stock imagery. Use deliberate composition, rich but tasteful material detail, excellent lighting and a polished contemporary magazine-art direction.",
    "Keep the central-left and lower-middle zones visually quiet enough for high-contrast overlaid text; place important illustrative detail toward the outer edges or upper-right where appropriate.",
    "Design mood/style: " + (style || "editorial") + ". Base palette " + backgroundColor + " and accent " + accentColor + ". These are colour references, not a requirement for a flat background.",
    "Carousel title: " + title,
    "Slide headline / meaning: " + headline,
    "Slide copy context: " + text,
    "Specific art direction: " + (direction || "Infer an apt visual metaphor from the slide's meaning."),
    "Avoid repetitive circles, generic gradients, random abstract blobs, clip art and overused corporate presentation aesthetics. The image should look deliberately commissioned for this exact message.",
  ].join("\n");

  try {
    const predictionResponse = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
        Prefer: "wait=55",
      },
      body: JSON.stringify({ input: { prompt, aspect_ratio: "4:5", output_format: "png", output_quality: 90, num_outputs: 1 } }),
      signal: AbortSignal.timeout(55000),
    });
    const prediction = await predictionResponse.json().catch(() => null);
    if (!predictionResponse.ok) {
      if (predictionResponse.status === 401 || predictionResponse.status === 403) return fail(502, "ART_PROVIDER_AUTH_ERROR", "The image provider rejected REPLICATE_API_TOKEN. Check the server-side Vercel environment variable.");
      return fail(502, "ART_PROVIDER_ERROR", "The image provider could not create artwork right now. Try again shortly.");
    }

    let output = prediction?.output;
    if (prediction?.status !== "succeeded" || !output) {
      return fail(504, "ART_GENERATION_TIMEOUT", "Artwork generation took too long. Try this slide again; your carousel text is unchanged.");
    }
    const imageUrl = Array.isArray(output) ? output[0] : output;
    if (typeof imageUrl !== "string" || !/^https:\/\//i.test(imageUrl)) {
      return fail(502, "ART_OUTPUT_INVALID", "The image provider returned an unexpected result. Please retry this slide.");
    }
    const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(20000) });
    if (!imageResponse.ok) return fail(502, "ART_DOWNLOAD_FAILED", "Artwork was generated but could not be loaded. Retry this slide.");
    const imageType = imageResponse.headers.get("content-type") || "image/png";
    if (!imageType.startsWith("image/")) return fail(502, "ART_OUTPUT_INVALID", "The provider did not return a usable image.");
    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    if (bytes.byteLength > 8 * 1024 * 1024) return fail(502, "ART_TOO_LARGE", "The generated image was too large to embed. Please retry.");
    return NextResponse.json({ image: "data:" + imageType + ";base64," + bytes.toString("base64") });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") return fail(504, "ART_GENERATION_TIMEOUT", "Artwork generation timed out. Your text carousel is unchanged; retry this slide.");
    return fail(502, "ART_GENERATION_FAILED", "Could not reach the image provider. Check your connection and try again.");
  }
}
