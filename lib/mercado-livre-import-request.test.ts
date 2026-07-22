import assert from "node:assert/strict";
import test from "node:test";
import {readMercadoLivreImportUrl,serializeMercadoLivreImportRequest} from "./mercado-livre-import-request.ts";
import {parseMercadoLivreUrl} from "./mercado-livre-url-parser.ts";

const mlbuUrl="https://www.mercadolivre.com.br/pistola-de-pulverizacao-eletrica-para-pintura-pulverizadora/up/MLBU3437902526?pdp_filters=seller_id%3A594550826#polycard_client=recommendations_vip-seller_items-above&reco_backend=ranker-retsys-same-seller&reco_model=rk_entity_sameseller&reco_client=vip-seller_items-above&reco_item_pos=1&reco_backend_type=low_level&reco_id=c4aae6e8-be13-4496-85fc-c67433633f09&wid=MLB4214733159&sid=recos";

test("preserva o hash do SmartImporter até o parser usado pela rota",()=>{
  const requestBody=serializeMercadoLivreImportRequest(mlbuUrl);
  assert.match(requestBody,/#polycard_client=/);
  const receivedUrl=readMercadoLivreImportUrl(JSON.parse(requestBody));
  assert.equal(receivedUrl,mlbuUrl);
  assert.deepEqual(parseMercadoLivreUrl(receivedUrl),{catalogDetected:false,productId:null,userProductId:"MLBU3437902526",itemId:"MLB4214733159"});
});
