"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: "🏠" },
    { name: "Inventory", href: "/inventory", icon: "📦" },
    { name: "Events", href: "/events", icon: "📅" },
    { name: "Kits & Racks", href: "/kits", icon: "🎛️" },
    { name: "Maintenance", href: "/maintenance", icon: "🔧" },
    { name: "Check In / Out", href: "/checkin", icon: "📋" },
    { name: "Reports", href: "/reports", icon: "📊" },
    { name: "Settings", href: "/settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">
      <h1 className="mb-8 text-2xl font-bold">
        🎛️ Church Tech Manager
      </h1>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg p-3 transition ${
              pathname === item.href
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-800"
            }`}
          >
            {item.icon} {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}