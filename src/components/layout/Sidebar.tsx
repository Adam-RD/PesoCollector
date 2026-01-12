'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLayout, FiUsers, FiFileText } from "react-icons/fi";

export const navLinks = [
  { href: "/dashboard", label: "Dashboard", Icon: FiLayout },
  { href: "/clients", label: "Clientes", Icon: FiUsers },
  { href: "/invoices", label: "Deudas", Icon: FiFileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel m-2 hidden h-auto flex-col gap-3 p-3 md:m-4 md:flex md:h-[calc(100vh-32px)] md:gap-4 md:p-4">
      <div className="mb-1 md:mb-2">
        <p className="text-xs uppercase tracking-widest text-slate-500">Navegacion</p>
      </div>
      <div className="flex flex-col gap-2">
        {navLinks.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors md:gap-3 md:px-3",
                active
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30"
                  : "text-slate-300 hover:text-cyan-200 hover:border hover:border-cyan-500/20",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <Icon className="text-cyan-300" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
