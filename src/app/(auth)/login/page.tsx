'use client';

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginSchema } from "@/features/auth/validators/auth.schemas";
import { FiLock, FiMail, FiKey, FiLogIn, FiUserPlus } from "react-icons/fi";

type LoginForm = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { username: "", password: "" } });

  const onSubmit = async (values: LoginForm) => {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      toast.error("Verifica tu usuario y contrasena");
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || "No pudimos iniciar sesion");
      return;
    }

    toast.success("Sesion iniciada");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md p-8">
        <div className="mb-4 flex items-center gap-3 text-cyan-300">
          <FiLock size={22} />
          <p className="text-xs uppercase tracking-[0.2em]">PesoCollector</p>
        </div>
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-semibold text-slate-100">
          <FiLogIn />
          <span>Accede para gestionar deudas</span>
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          Administra cuentas pendientes de tus clientes sin manejar facturas. Revisa saldos, registra pagos y mantente al dia.
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label={
              <span className="flex items-center gap-2">
                <FiMail className="text-cyan-300" />
                Usuario
              </span>
            }
            type="text"
            placeholder="admin"
            {...register("username")}
          />
          <Input
            label={
              <span className="flex items-center gap-2">
                <FiKey className="text-cyan-300" />
                Contrasena
              </span>
            }
            type="password"
            placeholder="Contrasena"
            {...register("password")}
          />
          <Button type="submit" disabled={isSubmitting}>
            <span className="flex items-center justify-center gap-2">
              <FiLogIn />
              {isSubmitting ? "Verificando..." : "Entrar"}
            </span>
          </Button>
          <div className="flex flex-col gap-1 text-xs text-slate-500">
            <p className="flex items-center gap-1">
              <FiUserPlus className="text-cyan-300" />
              Eres nuevo?{" "}
              <Link className="text-cyan-300 underline" href="/register">
                Crea tu cuenta
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
