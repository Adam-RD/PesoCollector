'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IAuthUser } from "@/features/auth/interfaces/IAuthUser";
import { Button } from "../ui/Button";

export function Navbar() {
  const router = useRouter();
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
    <nav className="glass-panel flex items-center justify-between px-6 py-4">
      <Link href="/dashboard" className="font-semibold text-cyan-300">
        PesoCollector
      </Link>
      <div className="flex items-center gap-4 text-sm text-slate-300">
        {user ? <span>{user.username}</span> : <span>Sesion</span>}
        <Button variant="ghost" onClick={logout} disabled={loading}>
          {loading ? "Saliendo..." : "Cerrar sesion"}
        </Button>
      </div>
    </nav>
  );
}
