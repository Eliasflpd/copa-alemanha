"use client";

import { useState, useEffect, useRef } from "react";

interface LoadingScreenProps {
  title: string;
  gifUrl: string;
  longWait?: boolean;
  startTime?: number;
}

const curiosidades = [
  "A Alemanha é tetracampeã mundial: 1954, 1974, 1990 e 2014!",
  "A Copa de 2026 será a primeira com 48 seleções na história!",
  "Miroslav Klose é o maior artilheiro de todas as Copas com 16 gols!",
  "Em 2014, a Alemanha goleou o Brasil por 7 a 1 na semifinal!",
  "Oliver Kahn foi eleito o melhor goleiro da Copa de 2002.",
  "A Alemanha disputou 8 finais de Copa — mais do que qualquer outro país!",
  "Franz Beckenbauer foi campeão como jogador (1974) e técnico (1990).",
  "Gerd Müller marcou 14 gols em apenas 2 Copas do Mundo.",
  "A Copa de 2026 será sediada nos EUA, México e Canadá.",
  "Lothar Matthäus disputou 5 Copas do Mundo pela Alemanha.",
  "A Alemanha ganhou o título de 2014 com um gol de Götze na prorrogação.",
  "O Bayern de Munique é o clube alemão mais vitorioso do mundo.",
  "A Bundesliga é a liga com maior média de público por jogo no mundo!",
  "Toni Kroos voltou da aposentadoria para a Copa de 2024.",
  "A Mannschaft é o apelido carinhoso da seleção alemã.",
  "Rudi Völler marcou o gol da virada na final da Copa de 1986.",
  "Manuel Neuer é considerado um dos melhores goleiros da história.",
  "A Alemanha foi a primeira equipe europeia a ganhar uma Copa nas Américas (2014, Brasil).",
];

export default function LoadingScreen({ title, gifUrl, longWait, startTime }: LoadingScreenProps) {
  const [percent, setPercent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [curiosidadeIndex, setCuriosidadeIndex] = useState(0);
  const start = useRef(startTime || Date.now());

  useEffect(() => {
    start.current = startTime || Date.now();
    setPercent(0);
    setElapsed(0);
    setCuriosidadeIndex(Math.floor(Math.random() * curiosidades.length));
  }, [startTime]);

  useEffect(() => {
    if (!longWait) return;
    const interval = setInterval(() => {
      setCuriosidadeIndex((prev) => (prev + 1) % curiosidades.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [longWait]);

  useEffect(() => {
    if (!longWait) {
      const duration = 3000;
      const interval = setInterval(() => {
        const progress = Math.min(100, Math.round(((Date.now() - start.current) / duration) * 100));
        setPercent(progress);
        if (progress >= 100) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - start.current;
      setElapsed(Math.floor(elapsedMs / 1000));
      let newPercent: number;
      if (elapsedMs < 60000) newPercent = Math.round((elapsedMs / 60000) * 80);
      else if (elapsedMs < 180000) newPercent = Math.round(80 + ((elapsedMs - 60000) / 120000) * 18);
      else newPercent = 99;
      setPercent((prev) => Math.max(prev, newPercent));
    }, 200);
    return () => clearInterval(interval);
  }, [longWait]);

  return (
    <section className="flex flex-col items-center justify-center min-h-[100dvh] w-full px-4">
      <div className="w-full max-w-md bg-de-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 animate-slide-up">
        <h2 className="text-3xl md:text-4xl font-bold text-de-black tracking-[0.1em] text-center" style={{ fontFamily: "var(--font-titulo)" }}>
          {title}
        </h2>

        {longWait && (
          <p className="text-sm font-bold text-de-black text-center -mt-4" style={{ fontFamily: "var(--font-papernotes)" }}>
            Não saia dessa tela, leva até 2 minutos.
          </p>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gifUrl} alt="Carregando..." className="w-48 h-48 rounded-2xl object-cover" />

        <p className="text-base text-center min-h-[3rem] transition-opacity duration-500" style={{ fontFamily: "var(--font-papernotes)" }}>
          {longWait ? (
            <><span className="text-de-red font-bold">Você sabia?</span>{" "}{curiosidades[curiosidadeIndex]}</>
          ) : (
            "Esse tem cara de jogador da seleção alemã! 🇩🇪"
          )}
        </p>

        <div className="w-full">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-de-black" style={{ fontFamily: "var(--font-papernotes)" }}>
              {longWait && elapsed > 0 ? `${elapsed}s` : "Carregando..."}
            </span>
            <span className="text-sm font-bold text-de-black" style={{ fontFamily: "var(--font-papernotes)" }}>{percent}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-de-black rounded-full transition-all duration-300 ease-out" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
