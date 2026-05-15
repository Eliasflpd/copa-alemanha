import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PDFDocument, rgb } from "pdf-lib";
import { put } from "@vercel/blob";
import { getDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const maxDuration = 300;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STICKER_W_CM = 6;
const STICKER_H_CM = 9;
const A4_W_CM = 21;
const A4_H_CM = 29.7;
const CM_TO_PT = 28.3465;
const STICKER_W = STICKER_W_CM * CM_TO_PT;
const STICKER_H = STICKER_H_CM * CM_TO_PT;
const A4_W = A4_W_CM * CM_TO_PT;
const A4_H = A4_H_CM * CM_TO_PT;
const COLS = Math.floor(A4_W_CM / STICKER_W_CM);
const ROWS = Math.floor(A4_H_CM / STICKER_H_CM);

async function generatePDF(stickerBytes: Uint8Array): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  let stickerImage;
  try { stickerImage = await pdf.embedPng(stickerBytes); }
  catch { stickerImage = await pdf.embedJpg(stickerBytes); }

  const page = pdf.addPage([A4_W, A4_H]);
  const gridW = COLS * STICKER_W;
  const gridH = ROWS * STICKER_H;
  const marginX = (A4_W - gridW) / 2;
  const marginY = (A4_H - gridH) / 2;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      page.drawImage(stickerImage, {
        x: marginX + col * STICKER_W,
        y: A4_H - marginY - (row + 1) * STICKER_H,
        width: STICKER_W,
        height: STICKER_H,
      });
    }
  }

  // Linhas de corte
  const gray = rgb(0.5, 0.5, 0.5);
  const MARK = 10;
  for (let row = 0; row <= ROWS; row++) {
    const y = A4_H - marginY - row * STICKER_H;
    page.drawLine({ start: { x: marginX - MARK, y }, end: { x: marginX, y }, thickness: 0.5, color: gray });
    page.drawLine({ start: { x: marginX + gridW, y }, end: { x: marginX + gridW + MARK, y }, thickness: 0.5, color: gray });
  }
  for (let col = 0; col <= COLS; col++) {
    const x = marginX + col * STICKER_W;
    page.drawLine({ start: { x, y: A4_H - marginY }, end: { x, y: A4_H - marginY + MARK }, thickness: 0.5, color: gray });
    page.drawLine({ start: { x, y: A4_H - marginY - gridH - MARK }, end: { x, y: A4_H - marginY - gridH }, thickness: 0.5, color: gray });
  }

  return Buffer.from(await pdf.save());
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, message: "Evento ignorado" });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const stickerId = session.metadata?.stickerId || session.client_reference_id || "";
  const customerEmail = session.customer_details?.email || "";
  const customerName = session.customer_details?.name || "Cliente";
  const stripeSessionId = session.id;

  if (!customerEmail) {
    console.error("Webhook sem email do cliente");
    return NextResponse.json({ error: "Email não encontrado" }, { status: 400 });
  }

  const sql = getDb();

  // Idempotência
  const idempotencyKey = `stripe-${stripeSessionId}`;
  const alreadyProcessed = await sql`SELECT 1 FROM webhook_processed WHERE idempotency_key = ${idempotencyKey}`.catch(() => []);
  if (alreadyProcessed.length > 0) {
    return NextResponse.json({ ok: true, message: "Já processado" });
  }
  await sql`INSERT INTO webhook_processed (idempotency_key) VALUES (${idempotencyKey}) ON CONFLICT DO NOTHING`.catch(() => {});

  // Buscar figurinha
  let stickerUrl: string | null = null;
  let resolvedStickerId: string | null = stickerId;

  if (stickerId) {
    const rows = await sql`SELECT sticker_url FROM pedidos WHERE sticker_id = ${stickerId} LIMIT 1`.catch(() => []);
    if (rows.length > 0) stickerUrl = rows[0].sticker_url;
  }

  if (!stickerUrl && customerEmail) {
    const rows = await sql`
      SELECT sticker_id, sticker_url FROM pedidos
      WHERE email = ${customerEmail} AND sticker_url IS NOT NULL
      ORDER BY created_at DESC LIMIT 1
    `.catch(() => []);
    if (rows.length > 0) { stickerUrl = rows[0].sticker_url; resolvedStickerId = rows[0].sticker_id; }
  }

  if (!stickerUrl) {
    console.error("Figurinha não encontrada para", customerEmail);
    return NextResponse.json({ error: "Figurinha não encontrada" }, { status: 404 });
  }

  try {
    const stickerRes = await fetch(stickerUrl);
    const stickerBytes = new Uint8Array(await stickerRes.arrayBuffer());

    const pdfBuffer = await generatePDF(stickerBytes);

    const pdfBlob = await put(`pdfs/${resolvedStickerId}.pdf`, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
      allowOverwrite: true,
    });

    await sql`
      UPDATE pedidos
      SET status = 'pago', email = ${customerEmail}, pdf_url = ${pdfBlob.url},
          stripe_session_id = ${stripeSessionId}, paid_at = NOW()
      WHERE sticker_id = ${resolvedStickerId}
    `.catch(() => {});

    const emailEnviado = await sendEmail(customerEmail, customerName, stickerBytes, pdfBuffer, pdfBlob.url);

    await sql`
      UPDATE pedidos
      SET status = ${emailEnviado ? "entregue" : "pago"}, delivered_at = ${emailEnviado ? new Date().toISOString() : null}
      WHERE sticker_id = ${resolvedStickerId}
    `.catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no webhook Stripe:", error);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
