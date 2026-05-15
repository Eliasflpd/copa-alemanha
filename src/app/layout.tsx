import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sua Figurinha da Copa 2026 | Alemanha",
  description:
    "Crie sua figurinha personalizada da Copa do Mundo 2026 com a camisa da Alemanha! Impressão profissional por apenas €9,90.",
  robots: "index, follow",
  openGraph: {
    title: "Sua Figurinha Copa 2026 — Alemanha",
    description: "Crie sua figurinha personalizada da Copa do Mundo 2026 com a camisa da Seleção Alemã!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
