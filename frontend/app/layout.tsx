import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { UserProvider } from "@/context/UserContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: "Library Star Pro | Dashboard",
  description: "Advanced Institutional Library Management",
  icons: {
    icon: "/icon.png",
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
