import { randomToken, sha256 } from "../../_shared/crypto.js";
import { getCookie, makeCookie } from "../../_shared/cookies.js";
import { PROVIDERS } from "../../_shared/providers.js";
import { verifyGoogleIdToken } from "../../_shared/oidc.js";

function erro(msg) {
  return new Response(msg, {
    status: 400,
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": makeCookie("__Host-oauth-tx", "", "Lax", 0),
    },
  });
}

export async function onRequestGet(context) {
  const nome = context.params.provider;
  if (nome !== "google" && nome !== "github") {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const url = new URL(context.request.url);
    if (url.searchParams.get("error")) return erro("Login cancelado");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const txId = getCookie(context.request, "__Host-oauth-tx");
    if (!code || !state || !txId) return erro("Parametros ausentes");
        const tx = await context.env.DB.prepare(
      "DELETE FROM oauth_transactions WHERE id_hash = ? RETURNING *"
    ).bind(await sha256(txId)).first();
    const agora = Math.floor(Date.now() / 1000);
    if (!tx) return erro("Transacao invalida");
    if (tx.expires_at <= agora) return erro("Transacao expirada");
    if (tx.provider !== nome) return erro("Provedor nao confere");
    if (tx.state_hash !== await sha256(state)) return erro("State invalido");
        const prefixo = nome.toUpperCase();
    const tokenRes = await fetch(PROVIDERS[nome].tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: context.env[prefixo + "_CLIENT_ID"],
        client_secret: context.env[prefixo + "_CLIENT_SECRET"],
        code,
        redirect_uri: `${context.env.PUBLIC_BASE_URL}/oauth/callback/${nome}`,
        grant_type: "authorization_code",
        code_verifier: tx.code_verifier,
      }),
    });
    if (!tokenRes.ok) return erro("Falha na troca de tokens");
    const tokens = await tokenRes.json();
        let issuer, subject, email, displayName;
    if (nome === "google") {
      if (!tokens.id_token) return erro("Sem id_token");
      const dados = await verifyGoogleIdToken(tokens.id_token, context.env.GOOGLE_CLIENT_ID, tx.nonce);
      issuer = dados.iss;
      subject = dados.sub;
      email = dados.email || null;
      displayName = dados.name || null;
    }
    else {
      if (!tokens.access_token || tokens.token_type?.toLowerCase() !== "bearer") return erro("Token invalido");
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
          "User-Agent": "projeto1-oauth",
        },
      });
      if (!userRes.ok) return erro("Falha ao buscar usuario");
      const user = await userRes.json();
            const basic = btoa(`${context.env.GITHUB_CLIENT_ID}:${context.env.GITHUB_CLIENT_SECRET}`);
      const revRes = await fetch(`https://api.github.com/applications/${context.env.GITHUB_CLIENT_ID}/grant`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
          "User-Agent": "projeto1-oauth",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: tokens.access_token }),
      });
      if (revRes.status !== 204) return erro("Falha ao revogar");
      issuer = "https://github.com";
      subject = String(user.id);
      email = user.email || null;
      displayName = user.name || user.login;
    }
        const sessionId = randomToken();
    await context.env.DB.prepare(
      "INSERT INTO sessions (id_hash, issuer, subject, email, display_name, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(await sha256(sessionId), issuer, subject, email, displayName, agora + 28800, agora).run();
    const headers = new Headers();
    headers.set("Location", "/");
    headers.set("Cache-Control", "no-store");
    headers.append("Set-Cookie", makeCookie("__Host-session", sessionId, "Strict", 28800));
    headers.append("Set-Cookie", makeCookie("__Host-oauth-tx", "", "Lax", 0));
    return new Response(null, { status: 302, headers });
  } catch (e) {
    return erro("Falha na autenticacao");
  }
}