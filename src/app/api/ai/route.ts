import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/* Générateur IA gratuit (Pollinations — sans clé API), proxifié côté serveur
   pour que le navigateur puisse ensuite traiter l'image (fond transparent). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const prompt = sp.get("prompt") ?? "";
  if (!prompt.trim()) return Response.json({ error: "Prompt manquant" }, { status: 400 });
  const width = Math.min(2048, Math.max(256, Number(sp.get("width") ?? 1024) || 1024));
  const height = Math.min(2048, Math.max(256, Number(sp.get("height") ?? 1024) || 1024));
  const style = sp.get("style") ?? "clean vector sticker";

  const full = `${prompt}, ${style}, centered composition, solid pure white background, no watermark, no text, high detail, print-ready`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error("provider");
    const blob = await res.arrayBuffer();
    const type = (res.headers.get("content-type") ?? "image/png").split(";")[0]!;
    return new Response(blob, {
      headers: {
        "Content-Type": type,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "Le service d'IA est momentanément saturé. Patientez 30 secondes puis réessayez (ou reformulez le prompt)." },
      { status: 502 }
    );
  }
}
