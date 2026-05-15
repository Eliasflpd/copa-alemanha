"use client";

export default function Obrigado() {
  const handleShare = () => {
    const url = process.env.NEXT_PUBLIC_APP_URL || "https://copa-alemanha.vercel.app";
    const text = "Olha que demais! Transformei meu filho em uma figurinha da Copa do Mundo 2026 com a camisa da Alemanha! Crie a sua também:";
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, "_blank");
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-de-gold px-5 py-8">
      {/* Flag strip */}
      <div className="flex w-full max-w-md h-3 rounded-full overflow-hidden mb-8">
        <div className="flex-1 bg-de-black" />
        <div className="flex-1 bg-de-red" />
        <div className="flex-1 bg-de-gold border border-de-black/20" />
      </div>

      <div className="w-full max-w-md flex flex-col items-center animate-slide-up">
        <h1 className="text-5xl md:text-7xl font-bold text-de-black text-center tracking-[0.1em] mb-1" style={{ fontFamily: "var(--font-titulo)" }}>
          DANKE! 🇩🇪
        </h1>

        <span className="text-5xl mb-4">⚽</span>

        <p className="text-xl text-center leading-relaxed mb-2" style={{ fontFamily: "var(--font-papernotes)" }}>
          Seu pagamento foi confirmado!
        </p>

        <p className="text-lg text-center leading-relaxed mb-2" style={{ fontFamily: "var(--font-papernotes)" }}>
          Sua <strong className="text-de-black">figurinha personalizada</strong> será
          enviada para o seu <strong>e-mail</strong> em até{" "}
          <strong className="text-de-red">30 minutos</strong>.
        </p>

        <p className="text-base text-gray-700 text-center mb-8" style={{ fontFamily: "var(--font-papernotes)" }}>
          O PDF virá pronto para impressão com 9 figurinhas no tamanho padrão (6x9 cm).
        </p>

        <a href="/"
          className="w-full bg-de-black text-de-gold font-bold text-xl py-5 rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer tracking-[0.1em] text-center block mb-3"
          style={{ fontFamily: "var(--font-titulo)" }}>
          CRIAR NOVA FIGURINHA
        </a>

        <button onClick={handleShare}
          className="w-full bg-de-red text-de-white font-bold text-xl py-5 rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer tracking-[0.1em] flex items-center justify-center gap-3"
          style={{ fontFamily: "var(--font-titulo)" }}>
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          COMPARTILHAR COM AMIGOS
        </button>
      </div>
    </main>
  );
}
