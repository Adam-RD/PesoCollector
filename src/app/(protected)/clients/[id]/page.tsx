import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClientDetailView, { ClientDetail, Debt } from "./ClientDetailView";

type RouteParams = { id: string };
type PageProps = { params: RouteParams } | { params: Promise<RouteParams> };

async function getClientWithDebts(id?: string): Promise<ClientDetail | null> {
  if (!id) return null;
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { dueDate: "desc" },
        },
      },
    });
    if (!client) return null;

    const invoices = client.invoices.map((invoice): Debt => {
      const amount = Number(invoice.amount);
      const paidAmount = invoice.paidAmount !== null ? Number(invoice.paidAmount) : null;
      const status = (paidAmount ?? 0) >= amount ? "PAID" : "PENDING";
      return {
        id: invoice.id,
        amount,
        paidAmount,
        status,
        dueDate: invoice.dueDate.toISOString(),
        createdAt: invoice.createdAt.toISOString(),
        description: invoice.description,
      };
    });

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      invoices,
    } satisfies ClientDetail;
  } catch (error) {
    console.error("Error al cargar detalle de cliente", error);
    return null;
  }
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await Promise.resolve(params);
  const client = await getClientWithDebts(id);

  if (!client) {
    notFound();
  }

  return <ClientDetailView client={client} />;
}
