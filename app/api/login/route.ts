import { NextRequest, NextResponse } from "next/server";
import { getExpectedPassword, getExpectedToken, safeEqual, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const password = body.password ?? "";

  let expectedPassword: string;
  let expectedToken: string;
  try {
    expectedPassword = getExpectedPassword();
    expectedToken = getExpectedToken();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Configuración incompleta." },
      { status: 500 }
    );
  }

  if (!safeEqual(password, expectedPassword)) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, expectedToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  return res;
}
