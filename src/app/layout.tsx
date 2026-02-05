import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeGenesis | Mission Control",
  description: "Autonomous Spatial Governance System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} antialiased bg-deep-space text-foreground overflow-hidden`}
      >
        <div className="fixed inset-0 z-0 pointer-events-none neon-grid opacity-20" />
        <main className="relative z-10 w-full h-screen overflow-hidden flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
