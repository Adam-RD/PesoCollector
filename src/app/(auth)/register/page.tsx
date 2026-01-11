'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiKey, FiLogIn, FiMail, FiUserPlus } from "react-icons/fi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerSchema } from "@/features/auth/validators/auth.schemas";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError("Verifica tu usuario y contraseña (mínimo 10 caracteres).");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "No pudimos crear tu cuenta");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleChange = (key: "username" | "password") => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md p-8">
        <div className="mb-4 flex items-center gap-3 text-cyan-300">
          <FiUserPlus size={22} />
          <p className="text-xs uppercase tracking-[0.2em]">PesoCollector</p>
        </div>
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-semibold text-slate-100">
          <FiUserPlus />
          <span>Crea tu cuenta</span>
        </h1>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Input
            label={
              <span className="flex items-center gap-2">
                <FiMail className="text-cyan-300" />
                Usuario
              </span>
            }
            type="text"
            placeholder="tu_usuario"
            value={form.username}
            onChange={handleChange("username")}
          />
          <Input
            label={
              <span className="flex items-center gap-2">
                <FiKey className="text-cyan-300" />
                Contraseña
              </span>
            }
            type="password"
            placeholder="Contraseña segura (10+)"
            value={form.password}
            onChange={handleChange("password")}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            <span className="flex items-center justify-center gap-2">
              <FiLogIn />
              {loading ? "Creando..." : "Registrarse"}
            </span>
          </Button>
          <p className="text-xs text-slate-500">
            Ya tienes cuenta?{" "}
            <Link className="text-cyan-300 underline" href="/login">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
