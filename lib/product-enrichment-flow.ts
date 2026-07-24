export type EnrichmentStage = "importing" | "generating" | "ready";

export async function runProductEnrichmentFlow<TImported, TGenerated>(options: {
  importProduct: () => Promise<TImported>;
  applyImported: (product: TImported) => void;
  generateContent: (product: TImported) => Promise<TGenerated>;
  applyGenerated: (content: TGenerated) => void;
  onStage: (stage: EnrichmentStage) => void;
}) {
  options.onStage("importing");
  const imported = await options.importProduct();
  options.applyImported(imported);
  options.onStage("generating");
  const generated = await options.generateContent(imported);
  options.applyGenerated(generated);
  options.onStage("ready");
  return { imported, generated };
}
