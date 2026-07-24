export type PartnerKey = "logzz" | "mercado_livre" | "amazon" | "shopee" | "magalu";
export type PartnerStatus =
  | "Conectado"
  | "Funcionando"
  | "Atenção necessária"
  | "Não configurado"
  | "Em desenvolvimento"
  | "Desativado";

export type PartnerOverview = {
  key: PartnerKey;
  name: string;
  status: PartnerStatus;
  availability: "Disponível" | "Experimental" | "Planejada";
  importedProducts: number;
  activeProducts: number;
  lastImport: string | null;
  lastSync: string | null;
  accountId?: string | null;
  connectionExpiresAt?: string | null;
  diagnostic: string;
  actions: Array<{ label: string; href: string }>;
};
