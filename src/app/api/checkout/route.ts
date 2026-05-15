import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stickerId = searchParams.get("src") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://copa-alemanha.vercel.app";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Figurinha Personalizada Copa 2026 — Alemanha 🇩🇪",
              description: "PDF com 9 figurinhas no tamanho padrão (6x9 cm) pronto para impressão.",
            },
            unit_amount: 990, // €9,90
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?cancelled=1`,
      metadata: { stickerId },
      client_reference_id: stickerId,
    });

    return NextResponse.redirect(session.url!);
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Erro ao criar sessão de pagamento" }, { status: 500 });
  }
}
