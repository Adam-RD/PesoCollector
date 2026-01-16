import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession({ clearInvalid: true });

  if (!session) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { passwordHash: _password, ...user } = session.user;
  return NextResponse.json({ user });
}
