'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FiEye, FiEyeOff, FiKey, FiLogIn, FiMail, FiUserPlus } from "react-icons/fi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerSchema } from "@/features/auth/validators/auth.schemas";

type RegisterForm = {
  username: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterForm>({ defaultValues: { username: "", password: "", confirmPassword: "" } });

  const onSubmit = async (values: RegisterForm) => {
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      toast.error("Verifica tu usuario y contraseヵa (mヴnimo 10 caracteres) y que ambas coincidan.");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || "No pudimos crear tu cuenta");
      return;
    }

    toast.success("Cuenta creada");
    router.push("/dashboard");
    router.refresh();
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
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label={
              <span className="flex items-center gap-2">
                <FiMail className="text-cyan-300" />
                Usuario
              </span>
            }
            type="text"
            placeholder="tu_usuario"
            autoComplete="off"
            {...register("username")}
          />
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="flex items-center gap-2 text-slate-300">
              <FiKey className="text-cyan-300" />
              Contraseヵa
            </span>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
                type={showPassword ? "text" : "password"}
                placeholder="Contraseヵa segura (10+)"
                autoComplete="new-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700 px-3 text-sm text-slate-200 hover:border-cyan-400"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="flex items-center gap-2 text-slate-300">
              <FiKey className="text-cyan-300" />
              Confirmar contraseヵa
            </span>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
                type={showConfirm ? "text" : "password"}
                placeholder="Vuelve a escribir la contraseヵa"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700 px-3 text-sm text-slate-200 hover:border-cyan-400"
              >
                {showConfirm ? <FiEyeOff /> : <FiEye />}
                {showConfirm ? "Ocultar" : "Ver"}
              </button>
            </div>
          </label>
          <Button type="submit" disabled={isSubmitting}>
            <span className="flex items-center justify-center gap-2">
              <FiLogIn />
              {isSubmitting ? "Creando..." : "Registrarse"}
            </span>
          </Button>
          <p className="text-xs text-slate-500">
            Ya tienes cuenta?{" "}
            <Link className="text-cyan-300 underline" href="/login">
              Inicia sesiИn
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
