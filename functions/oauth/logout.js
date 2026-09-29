import { sha256 } from "../_shared/crypto.js";
import { getCookie, makeCookie } from "../_shared/cookies.js";

export async function onRequestPost(context) {
  const origin = context.request.headers.get("Origin");
  if (!origin || origin !== context.env.PUBLIC_BASE_URL) {
    return new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const sessionId = getCookie(context.request, "__Host-session");
  if (sessionId) {
    await context.env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?")
      .bind(await sha256(sessionId)).run();
  }
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Cache-Control": "no-store",
      "Set-Cookie": makeCookie("__Host-session", "", "Strict", 0),
    },
  });
}

export function onRequestGet() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}