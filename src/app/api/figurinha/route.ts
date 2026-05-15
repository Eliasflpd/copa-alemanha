import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { getDb } from "@/lib/db";

export const maxDuration = 300;

// Tabela de crescimento — percentil 50 internacional
const growthChart: Record<number, { altura: number; peso: number }> = {
  0: { altura: 50, peso: 3 }, 1: { altura: 76, peso: 10 }, 2: { altura: 88, peso: 12 },
  3: { altura: 96, peso: 14 }, 4: { altura: 103, peso: 16 }, 5: { altura: 110, peso: 18 },
  6: { altura: 116, peso: 21 }, 7: { altura: 122, peso: 23 }, 8: { altura: 128, peso: 26 },
  9: { altura: 133, peso: 29 }, 10: { altura: 138, peso: 32 }, 11: { altura: 143, peso: 36 },
  12: { altura: 149, peso: 40 }, 13: { altura: 156, peso: 45 }, 14: { altura: 163, peso: 51 },
  15: { altura: 170, peso: 56 }, 16: { altura: 173, peso: 61 }, 17: { altura: 175, peso: 65 },
  18: { altura: 175, peso: 68 },
};

function getGrowthData(dataNascimento: string) {
  const birth = new Date(dataNascimento);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  if (age < 0) age = 0;
  const data = growthChart[Math.min(age, 18)] || growthChart[18];
  const alturaM = (data.altura / 100).toFixed(2).replace(".", ",");
  const birthDate = `${String(birth.getDate()).padStart(2, "0")}-${String(birth.getMonth() + 1).padStart(2, "0")}-${birth.getFullYear()}`;
  return { birthDate, altura: alturaM, peso: data.peso };
}

let cachedModeloBuffer: Buffer | null = null;

async function getModeloComprimido(): Promise<Buffer> {
  if (cachedModeloBuffer) return cachedModeloBuffer;
  const modeloPath = join(process.cwd(), "public", "modelo-figurinha.png");
  const modeloBuffer = readFileSync(modeloPath);
  cachedModeloBuffer = await sharp(modeloBuffer).resize(512).jpeg({ quality: 75 }).toBuffer();
  return cachedModeloBuffer;
}

const requestLog = new Map<string, number[]>();
function checkRateLimit(ip: string, maxRequests = 3, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) || [];
  const recent = timestamps.filter(t => now - t < windowMs);
  if (recent.length >= maxRequests) return false;
  recent.push(now);
  requestLog.set(ip, recent);
  return true;
}

function sanitizeInput(value: string, maxLen: number): string {
  return value.replace(/[^a-zA-ZÀ-ÿ0-9\s\-'.]/g, "").slice(0, maxLen).trim();
}

function getOpenAIKeys(): string[] {
  const keys: string[] = [];
  if (process.env.OPENAI_API_KEY) keys.push(process.env.OPENAI_API_KEY);
  if (process.env.OPENAI_API_KEY_2) keys.push(process.env.OPENAI_API_KEY_2);
  if (process.env.OPENAI_API_KEY_3) keys.push(process.env.OPENAI_API_KEY_3);
  return keys;
}

export async function POST(req: NextRequest) {
  const apiKeys = getOpenAIKeys();
  if (apiKeys.length === 0) return NextResponse.json({ error: "Serviço indisponível" }, { status: 500 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip)) return NextResponse.json({ error: "Muitas requisições. Aguarde 1 minuto." }, { status: 429 });

  let body: {
    nome: string; dataNascimento: string; email: string; clube: string;
    peso?: string; altura?: string; fotoBase64: string; errorTimestamp?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { nome, dataNascimento, email, clube, fotoBase64, errorTimestamp } = body;
  if (!nome || !dataNascimento || !clube || !fotoBase64) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const nomeSafe = sanitizeInput(nome, 50);
  const clubeSafe = sanitizeInput(clube, 50);

  if (nomeSafe.length < 2 || clubeSafe.length < 2) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dataNascimento)) return NextResponse.json({ error: "Data inválida" }, { status: 400 });

  if (fotoBase64.length > 7_000_000) return NextResponse.json({ error: "Imagem muito grande" }, { status: 400 });

  let fotoBuffer: Buffer;
  try {
    fotoBuffer = Buffer.from(fotoBase64, "base64");
    if (fotoBuffer.length > 5_000_000) return NextResponse.json({ error: "Imagem muito grande" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });
  }

  const sql = getDb();
  const emailSafe = email ? email.slice(0, 255).trim().toLowerCase() : null;

  // Retry após erro — buscar figurinha já gerada
  if (errorTimestamp && emailSafe) {
    try {
      const ts = new Date(errorTimestamp);
      if (!isNaN(ts.getTime())) {
        const existing = await sql`
          SELECT sticker_id, sticker_url FROM pedidos
          WHERE email = ${emailSafe} AND sticker_url IS NOT NULL AND created_at >= ${ts.toISOString()}
          ORDER BY created_at DESC LIMIT 1
        `;
        if (existing.length > 0) {
          const blobRes = await fetch(existing[0].sticker_url);
          const blobBuffer = Buffer.from(await blobRes.arrayBuffer());
          return NextResponse.json({ imageBase64: blobBuffer.toString("base64"), mimeType: "image/png", stickerId: existing[0].sticker_id });
        }
      }
    } catch (dbErr) {
      console.error("Erro na busca pós-erro:", dbErr);
    }
  }

  const modeloBuffer = await getModeloComprimido();

  const nomeUpper = nomeSafe.toUpperCase();
  const clubeFormatted = clubeSafe.toUpperCase();
  const growthData = getGrowthData(dataNascimento);
  const pesoFinal = body.peso ? String(body.peso) : String(growthData.peso);
  const alturaFinal = body.altura ? (Number(body.altura) / 100).toFixed(2).replace(".", ",") : growthData.altura;
  const infoLine = `${growthData.birthDate} | ${alturaFinal} m | ${pesoFinal} kg`;

  // Prompt adaptado para camisa da Alemanha
  const prompt = `You are given two images:
- Image 1: A photograph of a person (the SUBJECT). This person may be a child or an adult.
- Image 2: A collectible sports sticker card (the TEMPLATE).

TASK: Create a new version of the sticker card (Image 2) featuring the person from Image 1.

INSTRUCTIONS:

1. REMOVE the athlete from Image 2 entirely.

2. GENERATE a medium close-up portrait of the person from Image 1: from the chest up, facing forward, arms down. The person must wear the official white Germany 2026 national team jersey with black collar and the German eagle crest on the chest. IMPORTANT: the jersey and body must match the REAL proportions of the person from Image 1. If the subject is a child, draw a child-sized body with a child-sized jersey. If the subject is an adult, draw an adult-sized body. Do NOT put a child's head on an adult body.

3. The person's FACE must be identical to Image 1: same facial features, expression, hair, skin tone, eyes, smile. Do not alter the face in any way.

4. Place this portrait into the card, centered in the same area where the original athlete was.

5. Keep ALL other elements of Image 2 exactly as they are: background, graphics, all icons, emblems, flag, vertical text, logos, borders, card edges, bottom text area.

6. Update the text fields with the following data:
[NAME]: ${nomeUpper}
[INFO]: ${infoLine}
[CLUB]: ${clubeFormatted}

The result must look like a real printed collectible sticker card with a properly proportioned portrait of the person from Image 1 wearing the Germany national team jersey.`;

  try {
    let imageData = null;
    const BACKOFF_MS = [0, 10000, 20000];

    for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
      const openai = new OpenAI({ apiKey: apiKeys[keyIdx] });

      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));
        try {
          const fotoFile = await toFile(fotoBuffer, "foto.jpg", { type: "image/jpeg" });
          const modeloFile = await toFile(modeloBuffer, "modelo.jpg", { type: "image/jpeg" });
          const response = await openai.images.edit({ model: "gpt-image-2", image: [fotoFile, modeloFile], prompt, size: "768x1152" });
          imageData = response.data?.[0];
          if (imageData?.b64_json) break;
        } catch (apiErr: unknown) {
          const errMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
          if (errMsg.includes("429") || errMsg.includes("402") || errMsg.includes("insufficient")) {
            if (attempt === 2) break;
            continue;
          }
          throw apiErr;
        }
      }
      if (imageData?.b64_json) break;
    }

    if (!imageData?.b64_json) return NextResponse.json({ error: "Falha na geração" }, { status: 422 });

    const stickerId = randomUUID();
    const stickerBuffer = Buffer.from(imageData.b64_json, "base64");
    const blob = await put(`figurinhas/${stickerId}.png`, stickerBuffer, { access: "public", contentType: "image/png" });

    // Preview com marca d'água
    let previewBlobUrl = blob.url;
    try {
      const resizedBuf = await sharp(stickerBuffer).resize(400).toBuffer();
      const resMeta = await sharp(resizedBuf).metadata();
      const w = resMeta.width || 400;
      const h = resMeta.height || 600;
      const watermarkSvg = Buffer.from(`<svg width="${w}" height="${h}">
        <defs><pattern id="wm" x="0" y="0" width="200" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <text x="100" y="40" font-family="Arial" font-size="22" fill="rgba(255,255,255,0.45)" font-weight="900" text-anchor="middle">PREVIEW</text>
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#wm)"/>
      </svg>`);
      const previewBuffer = await sharp(resizedBuf).composite([{ input: watermarkSvg, blend: "over" }]).jpeg({ quality: 60 }).toBuffer();
      const previewBlob = await put(`previews/${stickerId}.jpg`, previewBuffer, { access: "public", contentType: "image/jpeg" });
      previewBlobUrl = previewBlob.url;
    } catch (wmErr) {
      console.error("Erro ao criar preview:", wmErr);
    }

    await sql`
      INSERT INTO pedidos (nome, data_nascimento, clube, peso_estimado, altura_estimada, sticker_id, sticker_url, preview_url, email, status)
      VALUES (${nomeSafe}, ${dataNascimento}, ${clubeSafe}, ${pesoFinal + " kg"}, ${alturaFinal + " m"}, ${stickerId}, ${blob.url}, ${previewBlobUrl}, ${emailSafe}, 'pendente')
    `;

    return NextResponse.json({ imageBase64: imageData.b64_json, mimeType: "image/png", stickerId });
  } catch (error: unknown) {
    console.error("Erro na geração:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Erro na geração. Tente novamente." }, { status: 500 });
  }
}
