const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://copa-alemanha.vercel.app";

function buildEmailHtml(customerName: string, pdfUrl?: string): string {
  const dlLink = pdfUrl ? `${APP_URL}/api/download?url=${encodeURIComponent(pdfUrl)}&name=figurinha-alemanha-2026` : "";
  return `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px;background:#fff">
    <div style="background:#000;padding:20px;text-align:center;border-radius:12px 12px 0 0">
      <h1 style="color:#FFCC00;margin:0;font-size:32px;letter-spacing:4px">🇩🇪 DEUTSCHLAND! 🇩🇪</h1>
    </div>
    <div style="padding:24px;border:2px solid #000;border-top:none;border-radius:0 0 12px 12px">
      <p style="font-size:18px;text-align:center">Ola <b>${customerName}</b>!</p>
      <p style="font-size:16px;text-align:center">Sua figurinha personalizada da Copa do Mundo 2026 <b>com a camisa da Alemanha</b> esta pronta!</p>
      ${dlLink ? `<div style="text-align:center;margin:20px 0"><a href="${dlLink}" style="display:inline-block;background:#DD0000;color:white;font-weight:bold;font-size:18px;padding:16px 40px;border-radius:12px;text-decoration:none">BAIXAR FIGURINHA (PDF)</a></div>` : ""}
      <p style="font-size:14px;color:#666;text-align:center">Em anexo voce encontra a figurinha (PNG) e o PDF para impressao com 9 figurinhas por pagina A4.</p>
      <hr style="border:1px solid #FFCC00;margin:20px 0"/>
      <p style="font-size:16px;text-align:center">Conhece alguem que ia amar ter uma figurinha personalizada?</p>
      <div style="text-align:center;margin:12px 0"><a href="${APP_URL}/" style="display:inline-block;background:#000;color:#FFCC00;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none">CRIAR NOVA FIGURINHA</a></div>
    </div>
  </div>`;
}

export async function sendEmail(
  to: string,
  customerName: string,
  stickerBytes: Uint8Array,
  pdfBuffer: Buffer,
  pdfUrl?: string
): Promise<boolean> {
  const fileNameBase = customerName.toLowerCase().replace(/\s+/g, "-");
  const subject = "Sua Figurinha da Copa 2026 — Alemanha esta pronta! 🇩🇪";
  const html = buildEmailHtml(customerName, pdfUrl);

  // 1. Resend (principal)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Figurinha Copa 2026 <onboarding@resend.dev>",
        to,
        subject,
        html,
        attachments: [
          { filename: `figurinha-${fileNameBase}.png`, content: Buffer.from(stickerBytes).toString("base64") },
          { filename: `figurinhas-impressao-${fileNameBase}.pdf`, content: pdfBuffer.toString("base64") },
        ],
      });
      console.log(`Email enviado via Resend para ${to}`);
      return true;
    } catch (err) {
      console.error("Resend falhou:", err instanceof Error ? err.message : err);
    }
  }

  // 2. Gmail SMTP (fallback)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `Figurinha Copa 2026 <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments: [
          { filename: `figurinha-${fileNameBase}.png`, content: Buffer.from(stickerBytes) },
          { filename: `figurinhas-impressao-${fileNameBase}.pdf`, content: pdfBuffer },
        ],
      });
      console.log(`Email enviado via Gmail para ${to}`);
      return true;
    } catch (err) {
      console.error("Gmail falhou:", err instanceof Error ? err.message : err);
    }
  }

  console.error(`FALHA TOTAL: nenhum metodo de envio funcionou para ${to}`);
  return false;
}
