import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

type Params = {
  params: { id: string };
};

async function getInvoice(id: string) {
  try {
    return await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, payments: true },
    });
  } catch (error) {
    console.error("Error al cargar deuda", error);
    return null;
  }
}

export default async function InvoiceDetailPage({ params }: Params) {
  const invoice = await getInvoice(params.id);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Deuda</p>
          <h1 className="text-2xl font-semibold text-slate-100">Deuda #{invoice.id.slice(0, 8)}</h1>
          <p className="text-slate-400">Cliente: {invoice.client?.name || "N/D"}</p>
          {invoice.description && <p className="text-slate-500">Concepto: {invoice.description}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Estado</p>
          <p className="text-lg font-semibold text-cyan-200">{invoice.status}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel p-4">
          <p className="text-sm text-slate-400">Monto</p>
          <p className="text-2xl font-bold text-cyan-200">{formatCurrency(Number(invoice.amount))}</p>
          <p className="mt-2 text-sm text-slate-400">Pagado: {formatCurrency(Number(invoice.paidAmount))}</p>
          <p className="text-sm text-slate-400">Vence: {formatDate(invoice.dueDate)}</p>
        </div>

        <div className="glass-panel p-4">
          <p className="text-sm text-slate-400">Pagos</p>
          <ul className="mt-3 space-y-3">
            {invoice.payments?.map((payment) => (
              <li key={payment.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <p className="font-semibold text-slate-200">{formatCurrency(Number(payment.amount))}</p>
                <p className="text-xs text-slate-500">
                  {payment.method} - {formatDate(payment.paidAt)}
                </p>
              </li>
            ))}
            {!invoice.payments?.length && <p className="text-sm text-slate-500">Sin pagos registrados aun.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
