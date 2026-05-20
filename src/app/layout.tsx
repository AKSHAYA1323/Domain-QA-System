import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DomainQA - Transformer-powered expert answers",
  description: "AI-powered Machine Learning Domain Question & Answering System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="max-w-[1800px] w-full mx-auto flex flex-col flex-1 gap-6">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
