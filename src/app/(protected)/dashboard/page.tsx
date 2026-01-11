import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import Link from "next/link";
import { FiClock, FiFileText, FiTrendingUp, FiUsers } from "react-icons/fi";

async function getStats() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [clients, invoices, pendingTotal, paidTotal, paidLast7, paidMonth, paidYear] = await Promise.all([
      prisma.client.count(),
      prisma.invoice.count(),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: "PENDING" },
      }),
      prisma.invoice.aggregate({
        _sum: { paidAmount: true },
        where: { status: "PAID" },
      }),
      prisma.invoice.aggregate({
        _sum: { paidAmount: true },
        where: { status: "PAID", updatedAt: { gte: sevenDaysAgo } },
      }),
      prisma.invoice.aggregate({
        _sum: { paidAmount: true },
        where: { status: "PAID", updatedAt: { gte: startOfMonth } },
      }),
      prisma.invoice.aggregate({
        _sum: { paidAmount: true },
        where: { status: "PAID", updatedAt: { gte: startOfYear } },
      }),
    ]);

    return {
      clients,
      invoices,
      pendingAmount: pendingTotal._sum.amount || 0,
      paidAmount: paidTotal._sum.paidAmount || 0,
      paidLast7: paidLast7._sum.paidAmount || 0,
      paidMonth: paidMonth._sum.paidAmount || 0,
      paidYear: paidYear._sum.paidAmount || 0,
    };
  } catch (error) {
    console.error("No se pudieron cargar las metricas", error);
    return { clients: 0, invoices: 0, pendingAmount: 0, paidAmount: 0, paidLast7: 0, paidMonth: 0, paidYear: 0 };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { title: "Clientes", value: stats.clients, Icon: FiUsers, hint: "Activos" },
    { title: "Deudas", value: stats.invoices, Icon: FiFileText, hint: "Registradas" },
    {
      title: "Pendiente",
      value: formatCurrency(Number(stats.pendingAmount)),
      Icon: FiClock,
      hint: "Por cobrar",
      highlight: "text-amber-200",
    },
    {
      title: "Pagadas",
      value: formatCurrency(Number(stats.paidAmount)),
      Icon: FiTrendingUp,
      hint: "Total pagado",
      highlight: "text-emerald-400",
    },
  ];

  const quickActions = [
    {
      href: "/clients",
      label: "Gestionar clientes",
      description: "Revisa y edita contactos",
      Icon: FiUsers,
    },
    {
      href: "/invoices",
      label: "Ver deudas",
      description: "Controla saldos y cobros",
      Icon: FiFileText,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-200/70">Dashboard</p>
          <h1 className="text-2xl font-semibold text-slate-100">Resumen general</h1>
        </div>
        <div className="flex items-center gap-2 self-start rounded-lg bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          <FiTrendingUp />
          <span>Accede a tus modulos con un clic</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map(({ title, value, Icon, hint, highlight }) => (
          <div key={title} className="glass-panel relative overflow-hidden p-4">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 via-cyan-500/0 to-purple-500/5" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">{title}</p>
                <p className={["mt-2 text-2xl font-bold", highlight || "text-cyan-200"].join(" ")}>{value}</p>
                <p className="text-xs text-slate-500">{hint}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
                <Icon />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass-panel p-4 text-slate-300">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-100">
            <FiTrendingUp className="text-cyan-300" />
            Accesos rapidos
          </h2>
          <div className="grid gap-3">
            {quickActions.map(({ href, label, description, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 transition hover:border-cyan-500/40 hover:bg-slate-900/60"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                    <Icon />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-100">{label}</p>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                </div>
                <FiClock className="text-slate-600 transition group-hover:text-cyan-300" />
              </Link>
            ))}
          </div>
        </section>

        <section className="glass-panel p-4 text-slate-300 lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-100">
            <FiTrendingUp className="text-cyan-300" />
            Pagos recientes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Ultimos 7 dias</p>
              <p className="text-xl font-bold text-cyan-200">{formatCurrency(Number(stats.paidLast7))}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Mes en curso</p>
              <p className="text-xl font-bold text-cyan-200">{formatCurrency(Number(stats.paidMonth))}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Ano en curso</p>
              <p className="text-xl font-bold text-cyan-200">{formatCurrency(Number(stats.paidYear))}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
