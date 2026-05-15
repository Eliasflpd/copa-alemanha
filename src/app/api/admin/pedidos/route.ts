import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminToken = req.headers.get("x-admin-token");
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";
  const limit = Number(searchParams.get("limit") || 50);
  const offset = Number(searchParams.get("offset") || 0);

  try {
    const rows = search
      ? await sql`SELECT * FROM pedidos WHERE nome ILIKE ${"%" + search + "%"} OR email ILIKE ${"%" + search + "%"} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
      : await sql`SELECT * FROM pedidos ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const total = await sql`SELECT COUNT(*) as count FROM pedidos`;
    const paid = await sql`SELECT COUNT(*) as count FROM pedidos WHERE status IN ('pago', 'entregue')`;

    return NextResponse.json({ rows, total: Number(total[0].count), paid: Number(paid[0].count) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
