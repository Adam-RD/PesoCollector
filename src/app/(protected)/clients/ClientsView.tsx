'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ClientDto, ClientForm, ClientWithStats } from "./types";
import { ClientList } from "./ClientList";
import { ClientForm as ClientFormComponent } from "./ClientForm";

type ClientsViewProps = {
  initialClients: ClientWithStats[];
};

const inputClasses =
  "rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400";
const primaryButtonClasses =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-slate-50 transition hover:bg-cyan-500 hover:rounded-xl hover:scale-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";
const ghostButtonClasses =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-500/30 hover:bg-slate-900/60 hover:rounded-xl hover:scale-[1.02] active:scale-[0.99]";
const emptyForm: ClientForm = { name: "", email: "", phone: "", notes: "" };

export default function ClientsView({ initialClients }: ClientsViewProps) {
  const [clients, setClients] = useState<ClientWithStats[]>(initialClients);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const { register, handleSubmit, reset } = useForm<ClientForm>({ defaultValues: emptyForm });

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.toLowerCase();
    return clients.filter((c) => {
      return c.name.toLowerCase().includes(term) || (c.phone || "").toLowerCase().includes(term);
    });
  }, [clients, search]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, clients.length]);

  const resetForm = () => {
    reset(emptyForm);
    setEditingId(null);
  };

  const upsertClient = async (values: ClientForm) => {
    setLoading(true);

    const payload = {
      name: values.name.trim(),
      email: values.email.trim() || undefined, // usamos email como direccion
      phone: values.phone.trim() || undefined,
      notes: values.notes.trim() || undefined,
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
      toast.error(data.message || "No se pudo guardar el cliente");
      setLoading(false);
      return;
    }

    const data = await res.json();
    const saved: ClientDto = data.client;
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

    if (editingId) {
      toast.warning("Cliente actualizado");
    } else {
      toast.success("Cliente creado");
    }
    setLoading(false);
    resetForm();
    refreshData();
  };

  const startEdit = (client: ClientWithStats) => {
    setEditingId(client.id);
    reset({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      notes: client.notes || "",
    });
  };

  const deleteClient = async (id: string) => {
    setLoading(true);

    const res = await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || "No se pudo eliminar el cliente");
      setLoading(false);
      return;
    }

    setClients((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) resetForm();
    toast.error("Cliente eliminado");
    setLoading(false);
    refreshData();
  };

  const refreshData = async () => {
    try {
      setSyncing(true);
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

      const merged: ClientWithStats[] = (clientsJson.clients || []).map((client: ClientDto) => {
        const stats = statsMap.get(client.id) || { pending: 0, paid: 0 };
        return { ...client, ...stats };
      });

      setClients(merged);
      toast.info("Listas actualizadas", { position: "bottom-right" });
    } catch (err) {
      toast.error("No se pudieron sincronizar los datos");
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
        <ClientList
          clients={paginatedClients}
          search={search}
          onSearchChange={setSearch}
          syncing={syncing}
          focusForm={focusForm}
          onEdit={startEdit}
          onDelete={deleteClient}
          page={currentPage}
          totalPages={totalPages}
          totalItems={filteredClients.length}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          ghostButtonClasses={ghostButtonClasses}
        />

        <ClientFormComponent
          formRef={formRef}
          editingId={editingId}
          loading={loading}
          onSubmit={handleSubmit(upsertClient)}
          onReset={resetForm}
          register={register}
          ghostButtonClasses={ghostButtonClasses}
          primaryButtonClasses={primaryButtonClasses}
          inputClasses={inputClasses}
        />
      </div>
    </div>
  );
}
