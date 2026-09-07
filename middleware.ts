import { NextRequest, NextResponse } from "next/server";

// Rutas accesibles sin sesión: la propia pantalla de login y su endpoint,
// más los assets estáticos de Next.
const PUBLIC_PATHS = ["/login", "/api/login"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const expectedToken = process.env.DASHBOARD_API_TOKEN;
  if (!expectedToken) {
    // Configuración incompleta: no bloqueamos con un 500 críptico, dejamos
    // pasar y que la página/API explique qué falta.
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("dash_session")?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const authorized = sessionCookie === expectedToken || bearerToken === expectedToken;

  if (authorized) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
