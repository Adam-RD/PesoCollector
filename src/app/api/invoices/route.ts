import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { invoiceSchema } from "@/features/invoices/validators/invoice.schemas";

const computeStatus = (amount: number, paidAmount: number) => (paidAmount >= amount ? "PAID" : "PENDING");

export async function GET(request: Request) {
  const session = await getSession({ clearInvalid: true });
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: session.user.id },
      include: { client: true, payments: true },
    });
    if (!invoice) return NextResponse.json({ message: "Factura no encontrada" }, { status: 404 });
    return NextResponse.json({ invoice });
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    include: { client: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const session = await getSession({ clearInvalid: true });
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = invoiceSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Datos invalidos" }, { status: 400 });

  const paidAmount = parsed.data.paidAmount ?? 0;
  const status = computeStatus(parsed.data.amount, paidAmount);

  const invoice = await prisma.invoice.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      paidAmount,
      status,
    },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await getSession({ clearInvalid: true });
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Falta el id" }, { status: 400 });

  const json = await request.json().catch(() => null);
  const parsed = invoiceSchema.partial().safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Datos invalidos" }, { status: 400 });

  const current = await prisma.invoice.findFirst({ where: { id, userId: session.user.id } });
  if (!current) return NextResponse.json({ message: "Factura no encontrada" }, { status: 404 });

  const nextAmount = parsed.data.amount ?? current.amount;
  const nextPaid = parsed.data.paidAmount ?? current.paidAmount ?? 0;
  const status = computeStatus(Number(nextAmount), Number(nextPaid));

  await prisma.invoice.updateMany({
    where: { id, userId: session.user.id },
    data: { ...parsed.data, status },
  });

  const invoice = await prisma.invoice.findFirst({ where: { id, userId: session.user.id }, include: { client: true, payments: true } });
  if (!invoice) return NextResponse.json({ message: "Factura no encontrada" }, { status: 404 });

  return NextResponse.json({ invoice });
}

export async function DELETE(request: Request) {
  const session = await getSession({ clearInvalid: true });
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Falta el id" }, { status: 400 });

  await prisma.invoice.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ message: "Eliminada" });
}
