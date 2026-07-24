import type { PartnerOverview, PartnerStatus } from "../types/partner.ts";

export type PartnerProductRecord = {
  source?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function normalizeProductSource(value: unknown) {
  const source = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (source === "logzz") return "logzz";
  if (source === "mercado_livre" || source === "mercado livre") return "mercado_livre";
  return "manual";
}

export function sourceMetrics(
  products: PartnerProductRecord[],
  source: "logzz" | "mercado_livre",
) {
  const matching = products.filter((product) => normalizeProductSource(product.source) === source);
  const dates = matching.map((product) => product.updated_at ?? product.created_at).filter((date): date is string => Boolean(date));
  return {
    importedProducts: matching.length,
    activeProducts: matching.filter((product) => product.status === "active").length,
    lastImport: dates.sort().at(-1) ?? null,
  };
}

export function integrationStatus(configured: boolean, connected: boolean, healthy: boolean): PartnerStatus {
  if (!configured) return "Não configurado";
  if (!connected) return "Atenção necessária";
  return healthy ? "Funcionando" : "Atenção necessária";
}

export function sanitizeDiagnostic(value: unknown): string {
  const text = value instanceof Error ? value.message : String(value ?? "");
  return text
    .replace(/bearer\s+[^\s,;]+/gi, "Bearer [protegido]")
    .replace(/(access_token|refresh_token|client_secret|authorization|cookie)\s*[:=]\s*[^\s,;]+/gi, "$1=[protegido]")
    .slice(0, 240);
}

export function buildPartnerOverview(input: {
  products: PartnerProductRecord[];
  logzzConfigured: boolean;
  mercadoLivreConfigured: boolean;
  mercadoLivreOAuthPresent: boolean;
  mercadoLivreAccountId?: string | null;
  mercadoLivreExpiresAt?: string | null;
}): PartnerOverview[] {
  const logzz = sourceMetrics(input.products, "logzz");
  const mercadoLivre = sourceMetrics(input.products, "mercado_livre");
  return [
    {
      key: "logzz",
      name: "Logzz",
      status: integrationStatus(input.logzzConfigured, input.logzzConfigured, true),
      availability: "Disponível",
      ...logzz,
      lastSync: null,
      diagnostic: input.logzzConfigured
        ? "Token configurado no servidor. A sincronização acontece somente quando o administrador importa ofertas."
        : "Token não configurado no servidor.",
      actions: [
        { label: "Abrir importador", href: "/admin/produtos/importar-logzz" },
        { label: "Ver produtos Logzz", href: "/admin/produtos?origem=logzz" },
      ],
    },
    {
      key: "mercado_livre",
      name: "Mercado Livre",
      status: integrationStatus(input.mercadoLivreConfigured, input.mercadoLivreOAuthPresent, false),
      availability: "Experimental",
      ...mercadoLivre,
      lastSync: mercadoLivre.lastImport,
      accountId: input.mercadoLivreAccountId ?? null,
      connectionExpiresAt: input.mercadoLivreExpiresAt ?? null,
      diagnostic: !input.mercadoLivreConfigured
        ? "Credenciais OAuth necessárias não estão completamente configuradas."
        : !input.mercadoLivreOAuthPresent
          ? "Credenciais presentes, mas nenhuma sessão OAuth foi detectada."
          : "OAuth detectado. A importação continua experimental e pode sofrer restrições de política da API.",
      actions: [
        { label: "Abrir cadastro assistido", href: "/admin/produtos/novo" },
        { label: "Conectar OAuth", href: "/api/auth/mercado-livre/start" },
      ],
    },
    ...(["amazon", "shopee", "magalu"] as const).map((key) => ({
      key,
      name: key === "amazon" ? "Amazon" : key === "shopee" ? "Shopee" : "Magalu",
      status: "Em desenvolvimento" as const,
      availability: "Planejada" as const,
      importedProducts: 0,
      activeProducts: 0,
      lastImport: null,
      lastSync: null,
      diagnostic: "Integração planejada. Nenhuma API ou credencial foi configurada.",
      actions: [],
    })),
  ];
}
