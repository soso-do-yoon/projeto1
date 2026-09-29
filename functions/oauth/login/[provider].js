import { randomToken, sha256 } from "../../_shared/crypto.js";
import { makeCookie } from "../../_shared/cookies.js";
import { PROVIDERS } from "../../_shared/providers.js";

export async function onRequestGet(context) {
  const nome = context.params.provider;
  if (nome !== "google" && nome !== "github") {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
    const txId = randomToken();
  const state = randomToken();
  const verifier = randomToken();
  const nonce = nome === "google" ? randomToken() : null;
    const expira = Math.floor(Date.now() / 1000) + 600;
  await context.env.DB.prepare(
    "INSERT INTO oauth_transactions (id_hash, provider, state_hash, nonce, code_verifier, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(await sha256(txId), nome, await sha256(state), nonce, verifier, expira).run();
    const url = new URL(PROVIDERS[nome].authUrl);
  url.searchParams.set("client_id", context.env[nome.toUpperCase() + "_CLIENT_ID"]);
  url.searchParams.set("redirect_uri", `${context.env.PUBLIC_BASE_URL}/oauth/callback/${nome}`);
  url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", await sha256(verifier));
  url.searchParams.set("code_challenge_method", "S256");
    if (nome === "google") {
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("nonce", nonce);
  }
    return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": makeCookie("__Host-oauth-tx", txId, "Lax", 600),
      "Cache-Control": "no-store",
    },
  });
}