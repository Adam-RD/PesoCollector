import { cookies } from "next/headers";

export const AUTH_COOKIE = "peso_session";

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthCookie(token: string, maxAge = 60 * 60 * 24 * 7) {
  const store = await cookies();
  store.set({
    name: AUTH_COOKIE,
    value: token,
    maxAge,
    ...baseOptions,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.set({
    name: AUTH_COOKIE,
    value: "",
    maxAge: 0,
    ...baseOptions,
  });
}

export async function getAuthCookie() {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value || null;
}
