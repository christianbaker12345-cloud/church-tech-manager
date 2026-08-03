"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: "🏠" },
    { name: "Inventory", href: "/inventory", icon: "📦" },
    { name: "Transfers", href: "/transfers", icon: "🚚" },
    { name: "Maintenance", href: "/maintenance", icon: "🔧" },
    { name: "Events", href: "/events", icon: "📅" },
    { name: "Kits & Racks", href: "/kits", icon: "🎛️" },
    { name: "Check In / Out", href: "/checkin", icon: "📋" },
    { name: "Reports", href: "/reports", icon: "📊" },
    { name: "Export Center", href: "/tools/export", icon: "📤" },
    { name: "Settings", href: "/settings", icon: "⚙️" },
  ];

  return (
    <aside className="min-h-screen w-64 bg-slate-900 p-6 text-white">
      <h1 className="mb-8 text-2xl font-bold">
        🎛️ Church Tech Manager
      </h1>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg p-3 transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800"
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}