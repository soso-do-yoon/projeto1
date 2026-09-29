function decodeB64url(texto) {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64);
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

export async function verifyGoogleIdToken(idToken, clientId, nonceEsperado) {
  const [h, p, s] = idToken.split(".");
  const header = JSON.parse(new TextDecoder().decode(decodeB64url(h)));
  const payload = JSON.parse(new TextDecoder().decode(decodeB64url(p)));
  if (header.alg !== "RS256") throw new Error("alg invalido");
  const disc = await (await fetch("https://accounts.google.com/.well-known/openid-configuration")).json();
  const jwks = await (await fetch(disc.jwks_uri)).json();
  const jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("chave nao encontrada");
    const chave = await crypto.subtle.importKey(
    "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]
  );
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5", chave, decodeB64url(s), new TextEncoder().encode(`${h}.${p}`)
  );
  if (!ok) throw new Error("assinatura invalida");
    const agora = Math.floor(Date.now() / 1000);
  if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") throw new Error("iss invalido");
  if (payload.aud !== clientId) throw new Error("aud invalido");
  if (payload.exp <= agora) throw new Error("token expirado");
  if (payload.iat > agora + 60) throw new Error("iat invalido");
  if (payload.nonce !== nonceEsperado) throw new Error("nonce invalido");
  return payload;
}