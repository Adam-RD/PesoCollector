import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { paymentSchema } from "@/features/invoices/validators/payment.schemas";

const computeStatus = (amount: number, paidAmount: number) => (paidAmount >= amount ? "PAID" : "PENDING");

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoiceId");

  const payments = await prisma.payment.findMany({
    where: invoiceId ? { invoiceId, userId: session.user.id } : { userId: session.user.id },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json({ payments });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = paymentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Datos invalidos" }, { status: 400 });

  const invoice = await prisma.invoice.findFirst({ where: { id: parsed.data.invoiceId, userId: session.user.id } });
  if (!invoice) return NextResponse.json({ message: "Deuda no encontrada" }, { status: 404 });

  const payment = await prisma.payment.create({
    data: {
      ...parsed.data,
      paidAt: parsed.data.paidAt || new Date(),
      userId: session.user.id,
    },
  });

  const totalPaid = await prisma.payment.aggregate({
    where: { invoiceId: parsed.data.invoiceId, userId: session.user.id },
    _sum: { amount: true },
  });

  const paidAmount = Number(totalPaid._sum.amount || 0);
  const status = computeStatus(Number(invoice.amount), paidAmount);

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { paidAmount, status },
  });

  return NextResponse.json({ payment }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Falta el id" }, { status: 400 });

  await prisma.payment.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ message: "Eliminado" });
}
