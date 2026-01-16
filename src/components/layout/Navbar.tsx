'use client';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FiLogOut } from "react-icons/fi";
import { IAuthUser } from "@/features/auth/interfaces/IAuthUser";
import { Button } from "../ui/Button";
import { navLinks } from "./Sidebar";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<IAuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const logout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="glass-panel flex items-center justify-between px-3 py-3 md:px-6 md:py-4">
      {/* Mobile: inline nav and logout icon */}
      <div className="flex w-full items-center justify-between gap-3 md:hidden">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {navLinks.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap",
                  active
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30"
                    : "text-slate-200 hover:text-cyan-200 hover:border hover:border-cyan-500/20",
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
        <button
          type="button"
          onClick={logout}
          disabled={loading}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-200 transition hover:border-rose-400/60 hover:bg-rose-500/20 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Cerrar sesion"
        >
          <FiLogOut />
        </button>
      </div>

      {/* Desktop: brand + user info */}
      <div className="hidden w-full items-center justify-between md:flex">
        <Link href="/dashboard" className="font-semibold text-cyan-300">
          PesoCollector
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-300">
          {user ? <span className="uppercase">{user.username}</span> : <span>Sesion</span>}
          <Button variant="danger" onClick={logout} disabled={loading}>
            {loading ? "Saliendo..." : "Cerrar sesion"}
          </Button>
        </div>
      </div>
    </nav>
  );
}
