export function getCookie(request, nome) {
  const linha = request.headers.get("Cookie") || "";
    for (const parte of linha.split(";")) {
    const [chave, ...resto] = parte.trim().split("=");
        if (chave === nome) return resto.join("=");
  }
    return null;
}

export function makeCookie(nome, valor, sameSite, maxAge) {
  return `${nome}=${valor}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=${maxAge}`;
}