"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { profile, loading } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const links = [
    { href: "/", label: "🏠 Dashboard" },
    { href: "/inventory", label: "📦 Inventory" },
    { href: "/inventory/new", label: "➕ Add Equipment" },
    { href: "/settings", label: "⚙️ Settings" },
  ];

  if (loading) return null;

  return (
    <aside className="flex h-screen w-72 flex-col border-r bg-white">

      <div className="border-b p-6">

        <h1 className="text-2xl font-bold">
          Church Tech Manager
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {profile?.role}
        </p>

      </div>

      <nav className="flex-1 p-4">

        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`mb-2 block rounded-lg px-4 py-3 transition ${
              pathname === link.href
                ? "bg-blue-100 font-semibold text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            {link.label}
          </Link>
        ))}

      </nav>

      <div className="border-t p-6">

        <p className="font-semibold">
          {profile?.full_name}
        </p>

        <p className="mb-4 text-sm text-gray-500">
          {profile?.role}
        </p>

        <Button
          className="w-full"
          variant="outline"
          onClick={signOut}
        >
          Sign Out
        </Button>

      </div>

    </aside>
  );
}