'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLayout, FiUsers, FiFileText } from "react-icons/fi";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: FiLayout },
  { href: "/clients", label: "Clientes", Icon: FiUsers },
  { href: "/invoices", label: "Deudas", Icon: FiFileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel m-4 flex h-[calc(100vh-32px)] flex-col gap-4 p-4">
      <div className="mb-2">
        <p className="text-xs uppercase tracking-widest text-slate-500">Navegación</p>
      </div>
      <div className="flex flex-col gap-2">
        {links.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
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
