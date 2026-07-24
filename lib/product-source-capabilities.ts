export type ProductSourceDetection = "mercado_livre" | "logzz" | "amazon" | "shopee" | "magalu" | "unsupported" | "invalid";
export type ProductSourceKey = Exclude<ProductSourceDetection, "unsupported" | "invalid">;
export const PRODUCT_SOURCE_CAPABILITIES = {
  mercado_livre: { name: "Mercado Livre", importSupported: true, status: "experimental", label: "Experimental" },
  logzz: { name: "Logzz", importSupported: true, status: "available", label: "Disponível" },
  amazon: { name: "Amazon", importSupported: false, status: "planned", label: "Em desenvolvimento" },
  shopee: { name: "Shopee", importSupported: false, status: "planned", label: "Em desenvolvimento" },
  magalu: { name: "Magalu", importSupported: false, status: "planned", label: "Em desenvolvimento" },
} as const;
const hosts: Record<ProductSourceKey, readonly string[]> = {
  mercado_livre: ["mercadolivre.com.br", "www.mercadolivre.com.br", "produto.mercadolivre.com.br"],
  logzz: ["app.logzz.com.br"],
  amazon: ["amazon.com.br", "www.amazon.com.br"],
  shopee: ["shopee.com.br", "www.shopee.com.br"],
  magalu: ["magazineluiza.com.br", "www.magazineluiza.com.br"],
};
export function detectProductSource(raw: string): ProductSourceDetection {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return "invalid";
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (host === "localhost" || host.endsWith(".localhost") || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) return "invalid";
    for (const [source, allowed] of Object.entries(hosts) as Array<[ProductSourceKey, readonly string[]]>) {
      if (allowed.includes(host)) return source;
    }
    return "unsupported";
  } catch { return "invalid" }
}
export function productSourceMessage(source: ProductSourceDetection) {
  if (source === "invalid") return "Informe uma URL HTTPS válida.";
  if (source === "unsupported") return "Este endereço não pertence a uma fonte compatível.";
  if (!PRODUCT_SOURCE_CAPABILITIES[source].importSupported) return `A importação automática da ${PRODUCT_SOURCE_CAPABILITIES[source].name} ainda não está disponível. Cadastre o produto manualmente ou use uma fonte compatível.`;
  return "";
}
export function productSourceAction(source: ProductSourceDetection): "mercado_livre_import" | "logzz_import" | "manual" {
  if (source === "mercado_livre") return "mercado_livre_import";
  if (source === "logzz") return "logzz_import";
  return "manual";
}
