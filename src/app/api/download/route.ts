import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get("url");
  const fileName = searchParams.get("name") || "figurinha-alemanha-2026";

  if (!fileUrl) return NextResponse.json({ error: "URL não informada" }, { status: 400 });

  try {
    const res = await fetch(fileUrl);
    if (!res.ok) return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const ext = contentType.includes("pdf") ? ".pdf" : ".png";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}${ext}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao baixar arquivo" }, { status: 500 });
  }
}
