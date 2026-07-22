export type MercadoLivreUrlIdentifier=
  |{catalogDetected:true;productId:string;itemId:null}
  |{catalogDetected:false;productId:null;itemId:string};

const ALLOWED_HOSTS=new Set(["mercadolivre.com.br","www.mercadolivre.com.br","produto.mercadolivre.com.br"]);
const CATALOG_PRODUCT_ID=/^MLB[0-9]+$/i;

export class MercadoLivreUrlParserError extends Error{
  readonly code:"INVALID_URL"|"ITEM_ID_NOT_FOUND";
  readonly details?:Record<string,unknown>;
  constructor(code:"INVALID_URL"|"ITEM_ID_NOT_FOUND",message:string,details?:Record<string,unknown>){super(message);this.name="MercadoLivreUrlParserError";this.code=code;this.details=details}
}

function pathnameSegments(pathname:string):string[]{
  return pathname.split("/").filter(Boolean).map(segment=>{
    try{return decodeURIComponent(segment)}catch{return segment}
  });
}

export function parseMercadoLivreUrl(rawUrl:string):MercadoLivreUrlIdentifier{
  let url:URL;
  try{url=new URL(rawUrl)}catch{throw new MercadoLivreUrlParserError("INVALID_URL","URL inválida. Informe o endereço completo do anúncio.")}
  const host=url.hostname.toLowerCase();
  if(url.protocol!=="https:"||!ALLOWED_HOSTS.has(host))throw new MercadoLivreUrlParserError("INVALID_URL","URL inválida. Use um link HTTPS do Mercado Livre Brasil.",{host,protocol:url.protocol});
  const queryItem=url.searchParams.get("item_id")?.match(/^MLB[-_]?([0-9]{6,})$/i);
  if(queryItem)return{catalogDetected:false,productId:null,itemId:`MLB${queryItem[1]}`};
  const segments=pathnameSegments(url.pathname);
  const lastSegment=segments.at(-1);
  const catalogProduct=lastSegment&&CATALOG_PRODUCT_ID.test(lastSegment)&&segments.length>1?lastSegment.toUpperCase():null;
  if(catalogProduct)return{catalogDetected:true,productId:catalogProduct,itemId:null};
  const normalizedPathname=`/${segments.join("/")}`;
  const listing=normalizedPathname.match(/(?:^|\/)MLB[-_]([0-9]{6,})(?:-|_|\/|$)/i);
  if(listing)return{catalogDetected:false,productId:null,itemId:`MLB${listing[1]}`};
  throw new MercadoLivreUrlParserError("ITEM_ID_NOT_FOUND","ITEM_ID não encontrado na URL. Use a URL completa de uma oferta no formato /MLB-1234567890-..., não um link encurtado ou página de catálogo.");
}
