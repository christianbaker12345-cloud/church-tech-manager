import "./globals.css";
import type { Metadata } from "next";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const metadata: Metadata = {
  title: "Church Tech Manager",
  description:
    "Equipment, maintenance, transfer, and readiness management for church production teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-950 antialiased">
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