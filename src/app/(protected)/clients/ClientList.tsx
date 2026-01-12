import Link from "next/link";
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { ClientWithStats } from "./types";

type ClientListProps = {
  clients: ClientWithStats[];
  search: string;
  onSearchChange: (value: string) => void;
  syncing: boolean;
  focusForm: () => void;
  onEdit: (client: ClientWithStats) => void;
  onDelete: (id: string) => void;
  page: number;
  totalPages: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
  ghostButtonClasses: string;
};

export function ClientList({
  clients,
  search,
  onSearchChange,
  syncing,
  focusForm,
  onEdit,
  onDelete,
  page,
  totalPages,
  totalItems,
  onPrev,
  onNext,
  ghostButtonClasses,
}: ClientListProps) {
  return (
    <div className="glass-panel overflow-hidden order-1">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Clientes</p>
          <h3 className="text-lg font-semibold text-slate-100">Lista y deudas</h3>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={focusForm} className={`${ghostButtonClasses} flex items-center gap-2 text-sm`}>
            <FiPlus /> Nuevo cliente
          </button>
          {syncing && <span className="text-xs text-cyan-300">Actualizando...</span>}
          <FiSearch className="text-slate-500" />
          <input
            className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
            placeholder="Buscar por nombre o telefono"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-900/40 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Direccion</th>
            <th className="px-4 py-3">Notas</th>
            <th className="px-4 py-3">Deudas</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-t border-slate-800 text-sm text-slate-200">
              <td className="px-4 py-3 font-medium">
                <Link href={`/clients/${client.id}`} className="text-cyan-300 hover:underline">
                  {client.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="text-slate-200">{client.email || "-"}</div>
                <div className="text-xs text-slate-500">{client.phone || ""}</div>
              </td>
              <td className="px-4 py-3 text-slate-400">{client.notes || "-"}</td>
              <td className="px-4 py-3 text-slate-400">
                <div className="font-semibold text-slate-200">{client.pending} pendientes</div>
                <div className="text-xs text-emerald-300">{client.paid} pagadas</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(client)}
                    className={`${ghostButtonClasses} flex items-center gap-1 text-xs`}
                  >
                    <FiEdit2 /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(client.id)}
                    className={`${ghostButtonClasses} flex items-center gap-1 text-xs text-red-300 hover:text-red-200`}
                  >
                    <FiTrash2 /> Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                No se encontraron clientes con ese criterio.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-sm text-slate-300">
        <span>
          Página {page} de {totalPages} ({totalItems} clientes)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={page === 1}
            className={`${ghostButtonClasses} px-2 py-1 disabled:opacity-60`}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={page === totalPages}
            className={`${ghostButtonClasses} px-2 py-1 disabled:opacity-60`}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
