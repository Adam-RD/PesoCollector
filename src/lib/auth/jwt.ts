import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface AuthTokenPayload extends JWTPayload {
  userId: string;
  username: string;
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export async function signAuthToken(payload: AuthTokenPayload, expiresIn = "7d") {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresIn).sign(secret);
}

export async function verifyAuthToken(token: string) {
  try {
    const { payload } = await jwtVerify<AuthTokenPayload>(token, secret);
    return payload;
  } catch {
    return null;
  }
}
