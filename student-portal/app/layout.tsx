import "./globals.css";
import { LayoutContent } from "./layout-content";

export const metadata = {
  title: "Olabs Student Portal",
  description: "Student portal for Olabs school management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
