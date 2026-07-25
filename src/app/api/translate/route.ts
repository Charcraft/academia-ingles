import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const translationCache = new Map<string, string>();

function decodeEntities(value: string) {
  return value
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = (await request.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text || text.length > 500) {
      return NextResponse.json(
        { error: "El texto debe tener entre 1 y 500 caracteres." },
        { status: 400 }
      );
    }

    const cached = translationCache.get(text);
    if (cached) return NextResponse.json({ translation: cached });

    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", "en|es");

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!response.ok) throw new Error("Translation provider unavailable");

    const data = (await response.json()) as {
      responseData?: { translatedText?: string };
    };
    const translation = decodeEntities(
      data.responseData?.translatedText?.trim() ?? ""
    );

    if (!translation) throw new Error("Empty translation");

    translationCache.set(text, translation);
    return NextResponse.json({ translation });
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener la traducción en este momento." },
      { status: 502 }
    );
  }
}
