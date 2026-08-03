import "./globals.css";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AppSidebar } from "@/components/layout/AppSidebar";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Church Tech Manager",
  description: "Church equipment management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} bg-slate-50 font-sans antialiased`}
      >
        <div className="flex min-h-screen">
          <AppSidebar />

          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] p-6 md:p-8 lg:p-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}