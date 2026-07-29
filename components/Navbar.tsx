"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { profile, loading } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function navClass(path: string) {
    return pathname === path
      ? "font-semibold text-blue-600"
      : "text-gray-600 hover:text-blue-600";
  }

  if (loading) return null;

  return (
    <header className="border-b bg-white shadow-sm">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

        <div>
          <Link
            href="/"
            className="text-3xl font-bold"
          >
            Church Tech Manager
          </Link>

          <p className="text-sm text-gray-500">
            {profile?.role}
          </p>
        </div>

        <nav className="flex items-center gap-6">

          <Link
            href="/"
            className={navClass("/")}
          >
            Dashboard
          </Link>

          <Link
            href="/inventory"
            className={navClass("/inventory")}
          >
            Inventory
          </Link>

          <Link
            href="/inventory/new"
            className={navClass("/inventory/new")}
          >
            Add Equipment
          </Link>

        </nav>

        <div className="flex items-center gap-4">

          <div className="text-right">

            <p className="font-semibold">
              {profile?.full_name}
            </p>

            <p className="text-sm text-gray-500">
              {profile?.role}
            </p>

          </div>

          <Button
            variant="outline"
            onClick={signOut}
          >
            Sign Out
          </Button>

        </div>

      </div>

    </header>
  );
}