"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  ChevronRight,
  ClipboardCheck,
  Download,
  Gauge,
  MapPin,
  Package,
  Upload,
  UserRound,
  Wrench,
} from "lucide-react";

type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

type NavigationSection = {
  label: string;
  items: NavigationItem[];
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

export function AppSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="sticky top-0 flex h-screen w-80 shrink-0 flex-col overflow-hidden border-r border-slate-300 bg-slate-200 shadow-[8px_0_24px_rgba(15,23,42,0.08)]">
      <div className="shrink-0 p-5">
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
      </div>

      <div className="min-h-0 flex-1 px-4 pb-4">
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
      </div>

      <div className="shrink-0 border-t border-slate-300 bg-slate-200 p-4">
        <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
              <UserRound size={18} strokeWidth={2.1} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-950">
                Christian Baker
              </p>

              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                Administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}