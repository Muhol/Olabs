import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { UserProvider } from "@/context/UserContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Script from "next/script";

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

export const viewport: Viewport = {
  themeColor: "#4C7C6D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Library Star Pro | Dashboard",
  description: "Advanced Institutional Library Management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Library Star Pro",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="">
        <head>
          <Script id="register-sw" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `}
          </Script>
        </head>
        <body className={`${nunito.variable}  font-nunito antialiased`}>
          <UserProvider>
            <DashboardLayout>
              {children}
            </DashboardLayout>
          </UserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
