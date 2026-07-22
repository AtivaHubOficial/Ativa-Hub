export function serializeMercadoLivreImportRequest(url:string):string{
  return JSON.stringify({url});
}

export function readMercadoLivreImportUrl(body:unknown):string{
  if(!body||typeof body!=="object"||typeof (body as{url?:unknown}).url!=="string")return"";
  return(body as{url:string}).url.trim();
}
