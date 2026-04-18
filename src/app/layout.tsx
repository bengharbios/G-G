import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ChatWidget from "@/components/ChatWidget";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ألعاب الغريب — منصة ألعاب جماعية عربية",
  description: "منصة ألعاب اجتماعية وحربية عربية. العب مع أصحابك في نفس الوقت من أي مكان - بدون تسجيل، بدون تطبيق.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <ChatWidget />
        <Toaster />
      </body>
    </html>
  );
}
