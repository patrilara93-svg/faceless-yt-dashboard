const SESSION_COOKIE = "dash_session";

/**
 * Autenticación deliberadamente simple: este es un panel personal de un
 * solo usuario (tú), no una app multiusuario. Una contraseña te da una
 * cookie de sesión; esa misma cookie (o un header Authorization: Bearer)
 * debe coincidir con DASHBOARD_API_TOKEN para poder llamar a la API.
 */

export function getExpectedToken(): string {
  const token = process.env.DASHBOARD_API_TOKEN;
  if (!token) {
    throw new Error("Falta DASHBOARD_API_TOKEN en las variables de entorno.");
  }
  return token;
}

export function getExpectedPassword(): string {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) {
    throw new Error("Falta DASHBOARD_PASSWORD en las variables de entorno.");
  }
  return password;
}

export { SESSION_COOKIE };

/** Comparación en tiempo constante simple, evita timing attacks triviales. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
