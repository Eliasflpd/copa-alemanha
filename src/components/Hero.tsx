"use client";

interface HeroProps {
  onStart: () => void;
}

export default function Hero({ onStart }: HeroProps) {
  return (
    <section className="flex flex-col items-center min-h-[100dvh] w-full px-5 py-8 text-center overflow-hidden justify-between">
      {/* Flag strip */}
      <div className="flex w-full max-w-md h-2 rounded-full overflow-hidden mb-2">
        <div className="flex-1 bg-de-black" />
        <div className="flex-1 bg-de-red" />
        <div className="flex-1 bg-de-gold" />
      </div>

      <h1
        className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] mb-4 max-w-2xl"
        style={{ fontFamily: "var(--font-titulo)" }}
      >
        Transforme seu filho em uma{" "}
        <span className="text-de-red">figurinha personalizada</span> da Copa do Mundo 🇩🇪
      </h1>

      {/* Placeholder figurinhas — substitua pelas imagens reais */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-[400px] mb-2">
        <div
          className="absolute left-0 top-6 w-36 h-52 md:w-48 md:h-72 rounded-xl overflow-hidden shadow-xl z-10 bg-de-black flex items-center justify-center"
          style={{ transform: "rotate(-8deg)", animation: "wiggle 4s ease-in-out infinite" }}
        >
          <span className="text-6xl">🇩🇪</span>
        </div>

        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-44 h-64 md:w-60 md:h-[340px] rounded-xl overflow-hidden shadow-2xl z-30 bg-de-black flex items-center justify-center"
          style={{ animation: "wiggle 4s ease-in-out infinite 0.5s" }}
        >
          <span className="text-7xl">⚽</span>
        </div>

        <div
          className="absolute right-0 top-6 w-36 h-52 md:w-48 md:h-72 rounded-xl overflow-hidden shadow-xl z-10 bg-de-black flex items-center justify-center"
          style={{ transform: "rotate(8deg)", animation: "wiggle 4s ease-in-out infinite 1s" }}
        >
          <span className="text-6xl">🇩🇪</span>
        </div>
      </div>

      <p
        className="text-lg md:text-xl max-w-md mb-4 leading-relaxed"
        style={{ fontFamily: "var(--font-papernotes)" }}
      >
        Responda algumas perguntas rápidas e veja seu pequeno craque com a camisa da{" "}
        <strong>Seleção Alemã</strong> na Copa do Mundo 2026!
      </p>

      <button
        onClick={onStart}
        className="w-full max-w-md bg-de-black text-de-gold font-bold text-2xl md:text-3xl py-5 rounded-2xl
          shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200
          animate-pulse-glow cursor-pointer tracking-[0.15em]"
        style={{ fontFamily: "var(--font-titulo)" }}
      >
        INICIAR
      </button>

      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex -space-x-2">
          {["🇩🇪", "🇦🇷", "🇫🇷", "🇧🇷", "🇪🇸"].map((flag, i) => (
            <span
              key={i}
              className="w-10 h-10 rounded-full bg-de-white flex items-center justify-center text-xl border-2 border-de-gold"
            >
              {flag}
            </span>
          ))}
        </div>
        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-papernotes)" }}>
          +1.000 figurinhas já criadas!
        </p>
      </div>
    </section>
  );
}
