import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "Parent Portal - Olabs",
  description: "A minimal and professional portal for parents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-background text-foreground flex flex-col min-h-screen">
        <Header />

        {/* Main Content Area */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="w-full bg-card border-t border-border/30 py-8 mt-12">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-foreground/60">
            &copy; {new Date().getFullYear()} Olabs. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
