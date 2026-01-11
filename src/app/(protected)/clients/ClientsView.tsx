'use client';

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Client } from "@prisma/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FiEdit2, FiPlus, FiSave, FiSearch, FiTrash2, FiX } from "react-icons/fi";

type ClientsViewProps = {
  initialClients: ClientWithStats[];
};

type ClientForm = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const emptyForm: ClientForm = { name: "", email: "", phone: "", notes: "" };

export type ClientWithStats = Client & {
  pending: number;
  paid: number;
};

export default function ClientsView({ initialClients }: ClientsViewProps) {
  const [clients, setClients] = useState<ClientWithStats[]>(initialClients);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLDivElement | null>(null);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.toLowerCase();
    return clients.filter((c) => {
      return c.name.toLowerCase().includes(term) || (c.phone || "").toLowerCase().includes(term);
    });
  }, [clients, search]);

  const handleChange = (key: keyof ClientForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const upsertClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/clients?id=${editingId}` : "/api/clients";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "No se pudo guardar el cliente");
      setLoading(false);
      return;
    }

    const data = await res.json();
    const saved: Client = data.client;
    const stats = clients.find((c) => c.id === saved.id);
    const savedWithStats: ClientWithStats = {
      ...saved,
      pending: stats?.pending ?? 0,
      paid: stats?.paid ?? 0,
    };

    setClients((prev) => {
      if (editingId) {
        return prev.map((c) => (c.id === savedWithStats.id ? savedWithStats : c));
      }
      return [savedWithStats, ...prev];
    });

    setMessage(editingId ? "Cliente actualizado" : "Cliente creado");
    setLoading(false);
    resetForm();
    refreshData();
  };

  const startEdit = (client: ClientWithStats) => {
    setEditingId(client.id);
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      notes: client.notes || "",
    });
    setMessage(null);
    setError(null);
  };

  const deleteClient = async (id: string) => {
    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "No se pudo eliminar el cliente");
      setLoading(false);
      return;
    }

    setClients((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) resetForm();
    setMessage("Cliente eliminado");
    setLoading(false);
    refreshData();
  };

  const refreshData = async () => {
    try {
      setSyncing(true);
      setError(null);
      const [clientsRes, invoicesRes] = await Promise.all([fetch("/api/clients"), fetch("/api/invoices")]);
      if (!clientsRes.ok || !invoicesRes.ok) throw new Error("No se pudo actualizar la lista");
      const clientsJson = await clientsRes.json();
      const invoicesJson = await invoicesRes.json();

      const invoices: { clientId: string; status: string }[] = invoicesJson.invoices || [];

      const statsMap = new Map<string, { pending: number; paid: number }>();
      invoices.forEach((inv) => {
        const current = statsMap.get(inv.clientId) || { pending: 0, paid: 0 };
        if (inv.status === "PAID") current.paid += 1;
        else current.pending += 1;
        statsMap.set(inv.clientId, current);
      });

      const merged: ClientWithStats[] = (clientsJson.clients || []).map((client: Client) => {
        const stats = statsMap.get(client.id) || { pending: 0, paid: 0 };
        return { ...client, ...stats };
      });

      setClients(merged);
      setMessage("Listas actualizadas");
    } catch (err) {
      setError("No se pudieron sincronizar los datos");
    } finally {
      setSyncing(false);
    }
  };

  const focusForm = () => {
    resetForm();
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel overflow-hidden order-2 md:order-1">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Clientes</p>
              <h3 className="text-lg font-semibold text-slate-100">Lista y deudas</h3>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={focusForm} className="flex items-center gap-2 text-sm">
                <FiPlus /> Nuevo cliente
              </Button>
              {syncing && <span className="text-xs text-cyan-300">Actualizando...</span>}
              <FiSearch className="text-slate-500" />
              <input
                className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                placeholder="Buscar por nombre o telefono"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900/40 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3">Deudas</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
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
                      <Button type="button" variant="ghost" onClick={() => startEdit(client)} className="flex items-center gap-1 text-xs">
                        <FiEdit2 /> Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => deleteClient(client.id)}
                        className="flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                      >
                        <FiTrash2 /> Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No se encontraron clientes con ese criterio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div ref={formRef} className="glass-panel p-4 order-1 md:order-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{editingId ? "Editar cliente" : "Nuevo cliente"}</p>
              <h2 className="text-lg font-semibold text-slate-100">{editingId ? "Actualiza los datos" : "Agrega un cliente"}</h2>
            </div>
            {editingId && (
              <Button variant="ghost" onClick={resetForm} className="flex items-center gap-2 text-sm">
                <FiX />
                Cancelar
              </Button>
            )}
          </div>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={upsertClient}>
            <Input label="Nombre" required value={form.name} onChange={handleChange("name")} placeholder="Cliente S.A." />
            <Input label="Email" type="email" value={form.email} onChange={handleChange("email")} placeholder="correo@cliente.com" />
            <Input label="Telefono" value={form.phone} onChange={handleChange("phone")} placeholder="+52 55 1234 5678" />
            <label className="flex flex-col gap-2 text-sm text-slate-200 md:col-span-2">
              <span className="text-slate-300">Notas</span>
              <textarea
                className="min-h-[80px] rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
                value={form.notes}
                onChange={handleChange("notes")}
                placeholder="Contacto preferido, condiciones de pago, etc."
              />
            </label>
            {error && <p className="md:col-span-2 text-sm text-red-400">{error}</p>}
            {message && <p className="md:col-span-2 text-sm text-emerald-300">{message}</p>}
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                {editingId ? <FiSave /> : <FiPlus />}
                {loading ? "Guardando..." : editingId ? "Actualizar" : "Crear cliente"}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
