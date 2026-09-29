export function randomToken() {
  const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
      return base64url(bytes);
}

export function base64url(bytes) {
  const texto = String.fromCharCode(...bytes);
    const base64 = btoa(texto);
      return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256(texto) {
  const dados = new TextEncoder().encode(texto);
    const resumo = await crypto.subtle.digest("SHA-256", dados);
      return base64url(new Uint8Array(resumo));
}