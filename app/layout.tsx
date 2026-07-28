import "./globals.css";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>
          <div className="flex min-h-screen bg-gray-100">
            <AppSidebar />
            <main className="flex-1 p-8">
              {children}
            </main>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}