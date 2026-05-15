"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PreviewContent() {
  const params = useSearchParams();
  const stickerUrl = params.get("img");
  const nome = params.get("nome") || "Craque";
  const stickerId = params.get("id") || "";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-de-gold px-4 py-8">
      <div className="w-full max-w-sm flex flex-col items-center animate-slide-up">
        {stickerUrl && (
          <div className="relative w-52 md:w-64 rounded-xl overflow-hidden shadow-2xl border-4 border-de-black mb-6"
            onContextMenu={(e) => e.preventDefault()} style={{ userSelect: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stickerUrl} alt={`Figurinha de ${nome}`} className="w-full aspect-[2/3] object-cover"
              draggable={false} style={{ pointerEvents: "none" }} />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="rotate-[-30deg] absolute w-[200%]" style={{ top: `${i * 22 - 10}%`, left: "-30%" }}>
                  <p className="text-white text-xl font-black tracking-[0.3em] whitespace-nowrap" style={{ opacity: 0.4 }}>
                    PREVIEW &nbsp; PREVIEW &nbsp; PREVIEW
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-de-black text-center tracking-[0.1em] mb-2" style={{ fontFamily: "var(--font-titulo)" }}>
          ÚLTIMA CHANCE! 🇩🇪
        </h1>

        <p className="text-lg text-center leading-relaxed mb-2" style={{ fontFamily: "var(--font-papernotes)" }}>
          A figurinha de <strong className="text-de-black">{nome}</strong> está prestes a ser excluída!
        </p>

        <p className="text-lg text-gray-500 line-through text-center" style={{ fontFamily: "'Montserrat', Arial Black, sans-serif", fontWeight: 900 }}>€9,90</p>
        <p className="text-5xl md:text-6xl text-de-red text-center mb-6 shine-effect" style={{ fontFamily: "'Montserrat', Arial Black, sans-serif", fontWeight: 900 }}>€7,90</p>

        <button
          onClick={() => {
            const checkoutUrl = `/api/checkout`;
            window.location.href = `${checkoutUrl}?src=${stickerId}&discount=1`;
          }}
          className="w-full bg-de-black text-de-gold font-bold text-xl py-5 rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer tracking-[0.1em] text-center block"
          style={{ fontFamily: "var(--font-titulo)" }}>
          QUERO MINHA FIGURINHA
        </button>
      </div>
    </main>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<main className="flex items-center justify-center min-h-screen bg-de-gold"><p>Carregando...</p></main>}>
      <PreviewContent />
    </Suspense>
  );
}
