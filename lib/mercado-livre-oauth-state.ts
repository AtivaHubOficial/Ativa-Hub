import {timingSafeEqual} from "node:crypto";

export type OAuthStateData={state?:string;verifier?:string;issuedAt?:number;redirectUri?:string};

export function validateOAuthStateData(data:OAuthStateData,received:string|undefined,redirectUri:string,now=Date.now()):string{
  if(!received||!data.state||!data.verifier||!data.issuedAt||!data.redirectUri)throw new Error("invalid_state");
  if(now-data.issuedAt>10*60*1000)throw new Error("expired_state");
  if(data.redirectUri!==redirectUri)throw new Error("invalid_state");
  const expected=Buffer.from(data.state),actual=Buffer.from(received);
  if(expected.length!==actual.length||!timingSafeEqual(expected,actual))throw new Error("invalid_state");
  return data.verifier;
}
