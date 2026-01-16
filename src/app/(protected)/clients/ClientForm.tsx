import type { FormEvent, RefObject } from "react";
import type { UseFormRegister } from "react-hook-form";
import { FiPlus, FiSave, FiX } from "react-icons/fi";
import { ClientForm as ClientFormState } from "./types";

type ClientFormProps = {
  editingId: string | null;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  register: UseFormRegister<ClientFormState>;
  ghostButtonClasses: string;
  primaryButtonClasses: string;
  inputClasses: string;
  formRef: RefObject<HTMLDivElement | null>;
};

export function ClientForm({
  editingId,
  loading,
  onSubmit,
  onReset,
  register,
  ghostButtonClasses,
  primaryButtonClasses,
  inputClasses,
  formRef,
}: ClientFormProps) {
  return (
    <div ref={formRef} className="glass-panel p-4 order-2">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{editingId ? "Editar cliente" : "Nuevo cliente"}</p>
          <h2 className="text-lg font-semibold text-slate-100">{editingId ? "Actualiza los datos" : "Agrega un cliente"}</h2>
        </div>
        {editingId && (
          <button onClick={onReset} className={`${ghostButtonClasses} flex items-center gap-2 text-sm`} type="button">
            <FiX />
            Cancelar
          </button>
        )}
      </div>
      <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          <span className="text-slate-300">Nombre</span>
          <input className={inputClasses} required placeholder="Cliente S.A." {...register("name")} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          <span className="text-slate-300">Direccion</span>
          <input className={inputClasses} type="text" placeholder="Direccion del cliente" {...register("email")} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          <span className="text-slate-300">Telefono</span>
          <input className={inputClasses} placeholder="809-000-0000" {...register("phone")} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200 md:col-span-2">
          <span className="text-slate-300">Notas</span>
          <textarea
            className="min-h-20 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            placeholder="Contacto preferido, condiciones de pago, etc."
            {...register("notes")}
          />
        </label>
        <div className="md:col-span-2 flex gap-3">
          <button type="submit" disabled={loading} className={`${primaryButtonClasses} flex items-center gap-2`}>
            {editingId ? <FiSave /> : <FiPlus />}
            {loading ? "Guardando..." : editingId ? "Actualizar" : "Crear cliente"}
          </button>
          {editingId && (
            <button type="button" onClick={onReset} className={ghostButtonClasses}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
