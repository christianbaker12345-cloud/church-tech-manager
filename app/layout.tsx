import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Church Tech Manager",
  description: "Church equipment management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">

        <div className="flex min-h-screen">

          <Sidebar />

          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>

        </div>

      </body>
    </html>
  );
}