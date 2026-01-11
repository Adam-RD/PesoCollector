import { prisma } from "@/lib/prisma";
import { Client } from "@prisma/client";
import InvoicesView, { InvoiceWithClient } from "./InvoicesView";

async function getInvoices() {
  try {
    return await prisma.invoice.findMany({
      include: { client: true, payments: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error al cargar deudas", error);
    return [];
  }
}

async function getClients() {
  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
    return clients.map((client) => ({ id: client.id, name: client.name }));
  } catch (error) {
    console.error("Error al cargar clientes", error);
    return [];
  }
}

export default async function InvoicesPage() {
  const [invoices, clients] = await Promise.all([getInvoices(), getClients()]);

  const serialized: InvoiceWithClient[] = invoices.map((invoice) => ({
    id: invoice.id,
    clientId: invoice.clientId,
    description: invoice.description,
    amount: Number(invoice.amount),
    paidAmount: invoice.paidAmount !== null ? Number(invoice.paidAmount) : null,
    status: invoice.status === "PAID" ? "PAID" : "PENDING",
    dueDate: invoice.dueDate.toISOString(),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    client: invoice.client ? { id: invoice.client.id, name: invoice.client.name } : null,
  }));

  return <InvoicesView initialInvoices={serialized} clients={clients} />;
}
