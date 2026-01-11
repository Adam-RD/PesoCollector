'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type Debt = {
  id: string;
  amount: number;
  paidAmount: number | null;
  status: "PENDING" | "PAID";
  dueDate: string;
  createdAt: string;
  description?: string | null;
};

const deriveDebtStatus = (amount: number, paidAmount: number | null): Debt["status"] => {
  const paid = paidAmount || 0;
  return paid >= amount ? "PAID" : "PENDING";
};

export type ClientDetail = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  invoices: Debt[];
};

type ClientDetailProps = {
  client: ClientDetail;
};

export default function ClientDetailView({ client }: ClientDetailProps) {
  const [debts, setDebts] = useState<Debt[]>(client.invoices);
  const [paying, setPaying] = useState<Record<string, boolean>>({});
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});
  const [payError, setPayError] = useState<Record<string, string | null>>({});
  const nextMonthISO = () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    return now.toISOString().slice(0, 10);
  };

  const [newDebt, setNewDebt] = useState<{ amount: string; description: string; dueDate: string }>({
    amount: "",
    description: "",
    dueDate: nextMonthISO(),
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const pending = debts.filter((d) => d.status === "PENDING");
    const paid = debts.filter((d) => d.status === "PAID");
    const pendingAmount = pending.reduce((acc, d) => acc + (d.amount - (d.paidAmount || 0)), 0);
    const totalAmount = debts.reduce((acc, d) => acc + d.amount, 0);
    return {
      pendingCount: pending.length,
      paidCount: paid.length,
      totalCount: debts.length,
      pendingAmount,
      totalAmount,
    };
  }, [debts]);

  const handlePay = async (debt: Debt) => {
    const remaining = debt.amount - (debt.paidAmount || 0);
    const amountValue = Number(payAmount[debt.id] || remaining);
    if (!amountValue || amountValue <= 0) {
      setPayError((prev) => ({ ...prev, [debt.id]: "Ingresa un monto valido" }));
      return;
    }
    setPayError((prev) => ({ ...prev, [debt.id]: null }));
    setPaying((prev) => ({ ...prev, [debt.id]: true }));
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: debt.id, amount: amountValue, method: "Manual" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "No se pudo registrar el pago");
      }
      const newPaid = Math.min(remaining, amountValue) + (debt.paidAmount || 0);
      const status = newPaid >= debt.amount ? "PAID" : "PENDING";
      setDebts((prev) => prev.map((d) => (d.id === debt.id ? { ...d, paidAmount: newPaid, status } : d)));
      setPayAmount((prev) => ({ ...prev, [debt.id]: "" }));
    } catch (err: any) {
      setPayError((prev) => ({ ...prev, [debt.id]: err.message || "Error al pagar" }));
    } finally {
      setPaying((prev) => ({ ...prev, [debt.id]: false }));
    }
  };

  const handleCreateDebt = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    setCreating(true);
    const amountNumber = Number(newDebt.amount);
    if (!amountNumber || amountNumber <= 0) {
      setCreateError("Ingresa un monto valido");
      setCreating(false);
      return;
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          amount: amountNumber,
          paidAmount: 0,
          description: newDebt.description || undefined,
          dueDate: newDebt.dueDate,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "No se pudo crear la deuda");
      }
      const data = await res.json();
      const invoice = data.invoice;
      const paidAmount = invoice.paidAmount !== null ? Number(invoice.paidAmount) : null;
      const amount = Number(invoice.amount);
      const added: Debt = {
        id: invoice.id,
        amount,
        paidAmount,
        status: deriveDebtStatus(amount, paidAmount),
        dueDate: new Date(invoice.dueDate).toISOString(),
        createdAt: new Date(invoice.createdAt).toISOString(),
        description: invoice.description,
      };
      setDebts((prev) => [added, ...prev]);
      setNewDebt({ amount: "", description: "", dueDate: nextMonthISO() });
    } catch (err: any) {
      setCreateError(err.message || "Error al crear deuda");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cliente</p>
        <h1 className="text-2xl font-semibold text-slate-100">{client.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
          <span>Email: {client.email || "N/D"}</span>
          <span>Telefono: {client.phone || "N/D"}</span>
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-100"
            href="/clients"
          >
            <span className="text-xs uppercase tracking-wide">Volver a clientes</span>
          </Link>
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Agregar deuda</p>
          <h3 className="text-lg font-semibold text-slate-100">Registra una deuda para {client.name}</h3>
        </div>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={handleCreateDebt}>
          <Input
            label="Monto"
            type="number"
            min="0"
            step="0.01"
            required
            value={newDebt.amount}
            onChange={(e) => setNewDebt((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <Input
            label="Vencimiento"
            type="date"
            required
            value={newDebt.dueDate}
            onChange={(e) => setNewDebt((prev) => ({ ...prev, dueDate: e.target.value }))}
          />
          <Input
            label="Descripcion (opcional)"
            value={newDebt.description}
            onChange={(e) => setNewDebt((prev) => ({ ...prev, description: e.target.value }))}
          />
          {createError && <p className="md:col-span-3 text-sm text-red-400">{createError}</p>}
          <div className="md:col-span-3">
            <Button type="submit" disabled={creating} className="flex items-center gap-2">
              {creating ? "Guardando..." : "Crear deuda"}
            </Button>
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">Deudas pendientes</p>
          <p className="mt-2 text-2xl font-bold text-amber-200">{summary.pendingCount}</p>
          <p className="text-sm text-slate-500">Monto pendiente: {formatCurrency(summary.pendingAmount)}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">Deudas pagadas</p>
          <p className="mt-2 text-2xl font-bold text-emerald-200">{summary.paidCount}</p>
          <p className="text-sm text-slate-500">Total deudas: {formatCurrency(summary.totalAmount)}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">Total de deudas</p>
          <p className="mt-2 text-2xl font-bold text-cyan-200">{summary.totalCount}</p>
          <p className="text-sm text-slate-500">Incluye pendientes y pagadas</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900/40 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Pagado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((invoice) => {
              const remaining = invoice.amount - (invoice.paidAmount || 0);
              return (
                <tr key={invoice.id} className="border-t border-slate-800 text-sm text-slate-200">
                  <td className="px-4 py-3">{formatCurrency(invoice.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        invoice.status === "PAID" ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200",
                      ].join(" ")}
                    >
                      {invoice.status === "PAID" ? "PAGADA" : "PENDIENTE"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatCurrency(invoice.paidAmount || 0)}
                    {invoice.status !== "PAID" && (
                      <p className="text-xs text-slate-500">Restante: {formatCurrency(remaining)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.status === "PAID" ? (
                      <span className="text-xs text-emerald-300">Pagada</span>
                    ) : (
                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <Input
                          className="md:w-32"
                          type="number"
                          min="0"
                          step="0.01"
                          value={payAmount[invoice.id] ?? remaining}
                          onChange={(e) => setPayAmount((prev) => ({ ...prev, [invoice.id]: e.target.value }))}
                        />
                        <Button
                          type="button"
                          onClick={() => handlePay(invoice)}
                          disabled={paying[invoice.id]}
                          className="flex items-center gap-2"
                        >
                          {paying[invoice.id] ? "Pagando..." : "Pagar"}
                        </Button>
                        {payError[invoice.id] && <span className="text-xs text-red-400">{payError[invoice.id]}</span>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {debts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay deudas registradas para este cliente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
