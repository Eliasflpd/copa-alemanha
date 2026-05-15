import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        data_nascimento DATE,
        clube VARCHAR(100),
        peso_estimado VARCHAR(20),
        altura_estimada VARCHAR(20),
        sticker_id VARCHAR(100),
        sticker_url TEXT,
        preview_url TEXT,
        pdf_url TEXT,
        email VARCHAR(255),
        telefone VARCHAR(30),
        status VARCHAR(20) DEFAULT 'pendente',
        stripe_session_id VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW(),
        paid_at TIMESTAMP,
        delivered_at TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS webhook_processed (
        id SERIAL PRIMARY KEY,
        idempotency_key VARCHAR(200) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_pedidos_email ON pedidos(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pedidos_sticker_id ON pedidos(sticker_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_processed_key ON webhook_processed(idempotency_key)`;

    return NextResponse.json({ ok: true, message: "Tabelas criadas com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
