import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/features/auth/validators/auth.schemas";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos invalidos" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    return NextResponse.json({ message: "Correo o contrasena incorrectos" }, { status: 401 });
  }

  const match = await bcrypt.compare(password, user.passwordHash);

  if (!match) {
    return NextResponse.json({ message: "Correo o contrasena incorrectos" }, { status: 401 });
  }

  await createSession(user.id, user.username);

  const { passwordHash: _password, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
