'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { Client } from "@prisma/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { FiEdit2, FiPlus, FiSave, FiTrash2, FiUsers, FiX } from "react-icons/fi";

type ClientLite = Pick<Client, "id" | "name">;

export type InvoiceWithClient = {
  id: string;
  clientId: string;
  description: string | null;
  amount: number;
  paidAmount: number | null;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  client: ClientLite | null;
};

type InvoicesViewProps = {
  initialInvoices: InvoiceWithClient[];
  clients: ClientLite[];
};

type InvoiceForm = {
  clientId: string;
  description: string;
  amount: string;
  paidAmount: string;
  status: InvoiceStatus;
  dueDate: string;
};

type InvoiceStatus = "PENDING" | "PAID";

const statusOptions: InvoiceStatus[] = ["PENDING", "PAID"];

const deriveStatus = (amount: number, paidAmount: number | null): InvoiceStatus => {
  const paid = paidAmount || 0;
  return paid >= amount ? "PAID" : "PENDING";
};

const defaultDueDate = () => {
  const now = new Date();
  now.setMonth(now.getMonth() + 1);
  return now.toISOString().slice(0, 10);
};

export default function InvoicesView({ initialInvoices, clients }: InvoicesViewProps) {
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>(() =>
    initialInvoices.map((inv) => ({
      ...inv,
      status: deriveStatus(inv.amount, inv.paidAmount),
    }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientSummary = useMemo(
    () =>
      clients.map((client) => {
        const related = invoices.filter((inv) => inv.clientId === client.id);
        const pending = related.filter((inv) => inv.status !== "PAID").length;
        return { ...client, pending, total: related.length };
      }),
    [clients, invoices]
  );

  const initialClientId = clients[0]?.id || "";
  const [form, setForm] = useState<InvoiceForm>({
    clientId: initialClientId,
    description: "",
    amount: "",
    paidAmount: "",
    status: "PENDING",
    dueDate: defaultDueDate(),
  });

  const handleChange =
    (key: keyof InvoiceForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      clientId: initialClientId,
      description: "",
      amount: "",
      paidAmount: "",
      status: "PENDING",
      dueDate: defaultDueDate(),
    });
  };

  const refreshInvoices = async () => {
    try {
      setSyncing(true);
      setError(null);
      const res = await fetch("/api/invoices");
      if (!res.ok) throw new Error("No se pudo refrescar");
      const data = await res.json();
      const refreshed: InvoiceWithClient[] = (data.invoices || []).map((inv: any) => ({
        id: inv.id,
        clientId: inv.clientId,
        description: inv.description ?? null,
        amount: Number(inv.amount),
        paidAmount: inv.paidAmount !== null ? Number(inv.paidAmount) : null,
        status: deriveStatus(Number(inv.amount), inv.paidAmount),
        dueDate: new Date(inv.dueDate).toISOString(),
        createdAt: new Date(inv.createdAt).toISOString(),
        updatedAt: new Date(inv.updatedAt).toISOString(),
        client: inv.client ? { id: inv.client.id, name: inv.client.name } : null,
      }));
      setInvoices(refreshed);
      setMessage("Lista de deudas actualizada");
    } catch (err) {
      setError("No se pudo refrescar la lista de deudas");
    } finally {
      setSyncing(false);
    }
  };

  const upsertInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const amountNumber = Number(form.amount);
    const paidNumber = form.paidAmount ? Number(form.paidAmount) : undefined;
    if (!form.clientId || Number.isNaN(amountNumber)) {
      setError("Faltan datos obligatorios");
      setLoading(false);
      return;
    }

    const payload = {
      clientId: form.clientId,
      description: form.description.trim() || undefined,
      amount: amountNumber,
      paidAmount: paidNumber,
      status: form.status,
      dueDate: form.dueDate,
    };

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/invoices?id=${editingId}` : "/api/invoices";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "No se pudo guardar la deuda");
      setLoading(false);
      return;
    }

    const data = await res.json();
    const saved: InvoiceWithClient = {
      id: data.invoice.id,
      clientId: data.invoice.clientId,
      description: data.invoice.description ?? null,
      amount: Number(data.invoice.amount),
      paidAmount: data.invoice.paidAmount !== null ? Number(data.invoice.paidAmount) : null,
      status: deriveStatus(Number(data.invoice.amount), data.invoice.paidAmount),
      dueDate: new Date(data.invoice.dueDate).toISOString(),
      createdAt: new Date(data.invoice.createdAt).toISOString(),
      updatedAt: new Date(data.invoice.updatedAt).toISOString(),
      client: clients.find((c) => c.id === data.invoice.clientId) || null,
    };

    setInvoices((prev) => {
      if (editingId) {
        return prev.map((inv) => (inv.id === saved.id ? saved : inv));
      }
      return [saved, ...prev];
    });

    setMessage(editingId ? "Deuda actualizada" : "Deuda creada");
    setLoading(false);
    resetForm();
    refreshInvoices();
  };

  const startEdit = (invoice: InvoiceWithClient) => {
    setEditingId(invoice.id);
    setForm({
      clientId: invoice.clientId,
      description: invoice.description || "",
      amount: String(invoice.amount),
      paidAmount: invoice.paidAmount ? String(invoice.paidAmount) : "",
      status: invoice.status,
      dueDate: new Date(invoice.dueDate).toISOString().slice(0, 10),
    });
    setMessage(null);
    setError(null);
  };

  const deleteInvoice = async (id: string) => {
    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "No se pudo eliminar la deuda");
      setLoading(false);
      return;
    }

    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    if (editingId === id) resetForm();
    setMessage("Deuda eliminada");
    setLoading(false);
    refreshInvoices();
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{editingId ? "Editar deuda" : "Nueva deuda"}</p>
            <h2 className="text-lg font-semibold text-slate-100">
              {editingId ? "Actualiza monto y estado" : "Registra una deuda pendiente"}
            </h2>
          </div>
          {editingId && (
            <Button variant="ghost" onClick={resetForm} className="flex items-center gap-2 text-sm">
              <FiX />
              Cancelar
            </Button>
          )}
        </div>

        <form className="grid gap-3 md:grid-cols-2" onSubmit={upsertInvoice}>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-slate-300">Cliente</span>
            <select
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              value={form.clientId}
              onChange={handleChange("clientId")}
              required
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Monto"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.amount}
            onChange={handleChange("amount")}
            placeholder="5000"
          />

          <Input
            label="Monto pagado (opcional)"
            type="number"
            min="0"
            step="0.01"
            value={form.paidAmount}
            onChange={handleChange("paidAmount")}
            placeholder="0"
          />

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            <span className="text-slate-300">Estado</span>
            <select
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              value={form.status}
              onChange={handleChange("status")}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <Input label="Vencimiento" type="date" required value={form.dueDate} onChange={handleChange("dueDate")} />

          <label className="flex flex-col gap-2 text-sm text-slate-200 md:col-span-2">
            <span className="text-slate-300">Descripcion</span>
            <textarea
              className="min-h-[80px] rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Concepto o referencia"
            />
          </label>

          {error && <p className="md:col-span-2 text-sm text-red-400">{error}</p>}
          {message && <p className="md:col-span-2 text-sm text-emerald-300">{message}</p>}

          <div className="md:col-span-2 flex gap-3">
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              {editingId ? <FiSave /> : <FiPlus />}
              {loading ? "Guardando..." : editingId ? "Actualizar" : "Crear deuda"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="glass-panel p-4">
        <div className="mb-3 flex items-center gap-2 text-slate-300">
          <FiUsers className="text-cyan-300" />
          <p className="text-sm font-semibold">Clientes y deudas pendientes</p>
          {syncing && <span className="ml-auto text-xs text-cyan-300">Actualizando...</span>}
        </div>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {clientSummary.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 transition hover:border-cyan-500/30 hover:bg-slate-900/60"
            >
              <div>
                <p className="font-semibold text-slate-100">{client.name}</p>
                <p className="text-xs text-slate-500">Total deudas: {client.total}</p>
              </div>
              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  client.pending > 0 ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/15 text-emerald-200",
                ].join(" ")}
              >
                {client.pending} pendientes
              </span>
            </Link>
          ))}
          {clientSummary.length === 0 && <p className="text-sm text-slate-500">No hay clientes registrados.</p>}
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900/40 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-slate-800 text-sm text-slate-200">
                <td className="px-4 py-3 font-medium">{invoice.client?.name || "Sin cliente"}</td>
                <td className="px-4 py-3">
                  <div>{formatCurrency(Number(invoice.amount))}</div>
                  {!!invoice.paidAmount && (
                    <p className="text-xs text-slate-500">Pagado: {formatCurrency(Number(invoice.paidAmount))}</p>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold">{invoice.status}</td>
                <td className="px-4 py-3 text-slate-400">{formatDate(invoice.dueDate)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => startEdit(invoice)} className="flex items-center gap-1 text-xs">
                      <FiEdit2 /> Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => deleteInvoice(invoice.id)}
                      className="flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                    >
                      <FiTrash2 /> Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay deudas registradas todavia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
