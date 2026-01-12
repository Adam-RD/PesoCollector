import { prisma } from "@/lib/prisma";
import ClientsView from "./ClientsView";
import { ClientWithStats } from "./types";
import { Invoice } from "@prisma/client";

async function getClientsWithStats(): Promise<ClientWithStats[]> {
  try {
    const [clients, grouped] = await Promise.all([
      prisma.client.findMany({ orderBy: { name: "asc" } }),
      prisma.invoice
        .groupBy({
          by: ["clientId", "status"],
          _count: { _all: true },
        })
        .catch(() => [] as { clientId: string; status: Invoice["status"]; _count: { _all: number } }[]),
    ]);

    const statsMap = new Map<string, { pending: number; paid: number }>();
    grouped.forEach((item) => {
      const current = statsMap.get(item.clientId) || { pending: 0, paid: 0 };
      if (item.status === "PAID") {
        current.paid += item._count._all;
      } else {
        current.pending += item._count._all;
      }
      statsMap.set(item.clientId, current);
    });

    return clients.map((client) => {
      const stats = statsMap.get(client.id) || { pending: 0, paid: 0 };
      return { ...client, ...stats };
    });
  } catch (error) {
    console.error("Error al cargar clientes", error);
    return [];
  }
}

export default async function ClientsPage() {
  const clientsWithStats = await getClientsWithStats();
  return <ClientsView initialClients={clientsWithStats} />;
}
