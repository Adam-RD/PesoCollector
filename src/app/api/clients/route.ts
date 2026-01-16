import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { clientSchema } from "@/features/clients/validators/client.schemas";

export async function GET(request: Request) {
  const session = await getSession({ clearInvalid: true });
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const client = await prisma.client.findFirst({ where: { id, userId: session.user.id } });
    if (!client) return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    return NextResponse.json({ client });
  }

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const session = await getSession({ clearInvalid: true });
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = clientSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Datos invalidos" }, { status: 400 });

  const client = await prisma.client.create({ data: { ...parsed.data, userId: session.user.id } });
  return NextResponse.json({ client }, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await getSession({ clearInvalid: true });
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Falta el id" }, { status: 400 });

  const json = await request.json().catch(() => null);
  const parsed = clientSchema.partial().safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Datos invalidos" }, { status: 400 });

  await prisma.client.updateMany({
    where: { id, userId: session.user.id },
    data: parsed.data,
  });

  const client = await prisma.client.findFirst({ where: { id, userId: session.user.id } });
  if (!client) return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });

  return NextResponse.json({ client });
}

export async function DELETE(request: Request) {
  const session = await getSession({ clearInvalid: true });
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Falta el id" }, { status: 400 });

  await prisma.client.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ message: "Eliminado" });
}
