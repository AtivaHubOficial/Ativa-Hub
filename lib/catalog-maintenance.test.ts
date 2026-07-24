import test from "node:test";
import assert from "node:assert/strict";
import { CATALOG_DELETION_SCOPE, canDeleteAll, canDeleteSource, findPossibleDuplicates, normalizeExternalUrl, validProductIds } from "./catalog-maintenance.ts";
import { sanitizeProductDescription } from "./safe-description.ts";
import { deselectVisibleProducts, selectVisibleProducts, toggleProductSelection } from "./product-selection.ts";

test("selection supports visible pages without losing previous IDs", () => {
  let selected = selectVisibleProducts(new Set(["one"]), ["two", "three"]);
  assert.deepEqual([...selected], ["one", "two", "three"]);
  selected = deselectVisibleProducts(selected, ["two"]);
  assert.deepEqual([...selected], ["one", "three"]);
  assert.deepEqual([...toggleProductSelection(selected, "one")], ["three"]);
});
test("destructive confirmations require exact phrases and allowed sources", () => {
  assert.equal(canDeleteAll("EXCLUIR TODOS"), true);
  assert.equal(canDeleteAll("excluir todos"), false);
  assert.equal(canDeleteSource("logzz", "EXCLUIR ORIGEM"), true);
  assert.equal(canDeleteSource("other", "EXCLUIR ORIGEM"), false);
  assert.deepEqual(validProductIds(["not-an-id"]), []);
});
test("catalog cleanup scope preserves categories, settings and administrators", () => {
  assert.equal(CATALOG_DELETION_SCOPE.deletedTable, "products");
  assert.deepEqual(CATALOG_DELETION_SCOPE.preservedTables, ["categories", "platform_settings", "admin_users"]);
});
test("external URL normalization removes tracking and fragments", () => {
  assert.equal(normalizeExternalUrl("https://EXAMPLE.com/p/1/?utm_source=x#top"), "https://example.com/p/1");
});
test("duplicate detection is conservative", () => {
  const groups = findPossibleDuplicates([
    { id:"1",title:"Produto X",source:"logzz",external_product_id:"10",external_offer_id:"20",price:10 },
    { id:"2",title:"Outro",source:"logzz",external_product_id:"10",external_offer_id:"20",price:20 },
    { id:"3",title:"Produto X",price:11 },
  ]);
  assert.equal(groups.length,1);
  assert.deepEqual(groups[0].products.map((item)=>item.id),["1","2"]);
});
test("imported descriptions become safe plain text", () => {
  assert.equal(sanitizeProductDescription("<p>Olá&nbsp;&amp; mundo</p><script>alert(1)</script>"), "Olá & mundo");
});
