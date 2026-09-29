import { sha256 } from "../_shared/crypto.js";
import { getCookie } from "../_shared/cookies.js";

export async function onRequestGet(context) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const sessionId = getCookie(context.request, "__Host-session");
  const sessao = sessionId
    ? await context.env.DB.prepare(
        "SELECT issuer, email, display_name, expires_at FROM sessions WHERE id_hash = ?"
      ).bind(await sha256(sessionId)).first()
    : null;
  if (!sessao || sessao.expires_at <= Math.floor(Date.now() / 1000)) {
    return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers });
  }
  return new Response(JSON.stringify({
    authenticated: true,
    issuer: sessao.issuer,
    email: sessao.email,
    displayName: sessao.display_name,
  }), { headers });
}