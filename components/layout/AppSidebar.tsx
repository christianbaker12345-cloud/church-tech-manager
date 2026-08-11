"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  ChevronRight,
  ClipboardCheck,
  Download,
  Gauge,
  LogOut,
  MapPin,
  Menu,
  Package,
  Upload,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

type Profile = {
  full_name: string | null;
  role: string | null;
};

const sections: NavigationSection[] = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: Gauge,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        name: "Inventory",
        href: "/inventory",
        icon: Package,
      },
      {
        name: "Locations",
        href: "/locations",
        icon: MapPin,
      },
      {
        name: "Transfers",
        href: "/transfers",
        icon: ArrowLeftRight,
      },
      {
        name: "Maintenance",
        href: "/maintenance",
        icon: Wrench,
      },
      {
        name: "Check In / Out",
        href: "/checkin",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: "Data Tools",
    items: [
      {
        name: "Import Center",
        href: "/tools/import",
        icon: Upload,
      },
      {
        name: "Export Center",
        href: "/tools/export",
        icon: Download,
      },
    ],
  },
];

type SidebarNavigationProps = {
  pathname: string;
  onNavigate?: () => void;
};

function SidebarNavigation({
  pathname,
  onNavigate,
}: SidebarNavigationProps) {
  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Main navigation"
      className="h-full overflow-y-auto overscroll-contain rounded-3xl border border-slate-300 bg-slate-100 p-4 shadow-inner [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-transparent"
    >
      <div className="space-y-8 pb-4">
        {sections.map((section) => (
          <section key={section.label}>
            <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {section.label}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-blue-200 ${
                      active
                        ? "bg-white text-blue-700 shadow-md shadow-slate-900/10"
                        : "text-slate-700 hover:bg-white hover:text-slate-950 hover:shadow-sm"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-blue-600" />
                    )}

                    <span
                      className={`ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                        active
                          ? "bg-blue-100 text-blue-700"
                          : "bg-white text-slate-500 shadow-sm group-hover:text-slate-800"
                      }`}
                    >
                      <Icon size={18} strokeWidth={2.1} />
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {item.name}
                    </span>

                    <ChevronRight
                      size={16}
                      className={`shrink-0 transition ${
                        active
                          ? "translate-x-0 text-blue-500 opacity-100"
                          : "-translate-x-1 text-slate-400 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </nav>
  );
}

function BrandCard() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-4 rounded-3xl border border-white/80 bg-white px-5 py-5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-blue-200"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-black tracking-tight text-white shadow-lg shadow-blue-900/20 transition group-hover:scale-[1.03]">
        TS
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-extrabold leading-tight text-slate-950">
          Tech Steward
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />

          <p className="text-xs font-semibold text-slate-500">
            Production Operations
          </p>
        </div>
      </div>
    </Link>
  );
}

type UserCardProps = {
  profile: Profile | null;
  email: string;
  signingOut: boolean;
  onSignOut: () => void;
};

function UserCard({
  profile,
  email,
  signingOut,
  onSignOut,
}: UserCardProps) {
  const displayName =
    profile?.full_name?.trim() ||
    email.split("@")[0] ||
    "Tech Steward User";

  const displayRole = profile?.role || "Read Only";

  return (
    <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
          <UserRound size={18} strokeWidth={2.1} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-950">
            {displayName}
          </p>

          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
            {displayRole}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut size={16} />

        {signingOut ? "Signing Out..." : "Sign Out"}
      </button>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadCurrentUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setEmail("");
      return;
    }

    setEmail(user.email ?? "");

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Unable to load user profile:", error);
      setProfile(null);
      return;
    }

    setProfile(data);
  }

  async function handleSignOut() {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      alert(error.message);
      setSigningOut(false);
      return;
    }

    setProfile(null);
    setEmail("");
    setMobileMenuOpen(false);
    setSigningOut(false);

    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-80 shrink-0 flex-col overflow-hidden border-r border-slate-300 bg-slate-200 shadow-[8px_0_24px_rgba(15,23,42,0.08)] lg:flex">
        <div className="shrink-0 p-5">
          <BrandCard />
        </div>

        <div className="min-h-0 flex-1 px-4 pb-4">
          <SidebarNavigation pathname={pathname} />
        </div>

        <div className="shrink-0 border-t border-slate-300 bg-slate-200 p-4">
          <UserCard
            profile={profile}
            email={email}
            signingOut={signingOut}
            onSignOut={handleSignOut}
          />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black tracking-tight text-white shadow-md shadow-blue-900/20">
            TS
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-950">
              Tech Steward
            </p>

            <p className="truncate text-[11px] font-semibold text-slate-500">
              Production Operations
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none transition hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <Menu size={22} strokeWidth={2.1} />
        </button>
      </header>

      {/* Mobile overlay */}
      <div
        aria-hidden={!mobileMenuOpen}
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Mobile drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed inset-y-0 left-0 z-[60] flex w-[min(88vw,22rem)] flex-col overflow-hidden border-r border-slate-300 bg-slate-200 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <BrandCard />
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-4 focus-visible:ring-blue-200"
          >
            <X size={21} strokeWidth={2.1} />
          </button>
        </div>

        <div className="min-h-0 flex-1 px-4 pb-4">
          <SidebarNavigation
            pathname={pathname}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </div>

        <div className="shrink-0 border-t border-slate-300 p-4">
          <UserCard
            profile={profile}
            email={email}
            signingOut={signingOut}
            onSignOut={handleSignOut}
          />
        </div>
      </aside>
    </>
  );
}