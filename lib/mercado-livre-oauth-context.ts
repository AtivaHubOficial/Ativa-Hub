export type MercadoLivreOAuthContext={requestOrigin:string;origin:string;redirectUri:string;secureCookie:true;delegateToRegisteredOrigin:boolean};

export function resolveMercadoLivreOAuthContext(requestUrl:string,configuredRedirectUri?:string):MercadoLivreOAuthContext{
  const requestOrigin=new URL(requestUrl).origin;
  if(!configuredRedirectUri?.trim())throw new Error("OAuth redirect URI is not configured");
  const redirect=new URL(configuredRedirectUri);
  if(redirect.protocol!=="https:"||redirect.pathname!=="/api/auth/mercado-livre/callback")throw new Error("OAuth redirect URI must be the registered HTTPS callback");
  return{requestOrigin,origin:redirect.origin,redirectUri:redirect.toString(),secureCookie:true,delegateToRegisteredOrigin:requestOrigin!==redirect.origin};
}
