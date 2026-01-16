import { prisma } from "@/lib/prisma";
import { clearAuthCookie, getAuthCookie, setAuthCookie } from "./cookies";
import { signAuthToken, verifyAuthToken } from "./jwt";

export async function createSession(userId: string, username: string) {
  const token = await signAuthToken({ userId, username });
  await setAuthCookie(token);
  return token;
}

type GetSessionOptions = {
  clearInvalid?: boolean;
};

export async function getSession(options: GetSessionOptions = {}) {
  const { clearInvalid = false } = options;
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload) {
    if (clearInvalid) {
      await clearAuthCookie();
    }
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    if (clearInvalid) {
      await clearAuthCookie();
    }
    return null;
  }

  return { user, token };
}

export async function endSession() {
  await clearAuthCookie();
}
