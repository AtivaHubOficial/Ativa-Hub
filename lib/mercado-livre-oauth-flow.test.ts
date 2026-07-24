import assert from "node:assert/strict";
import test from "node:test";
import {resolveMercadoLivreOAuthContext} from "./mercado-livre-oauth-context.ts";
import {validateOAuthStateData} from "./mercado-livre-oauth-state.ts";
import {isLocalOAuthRequest,registeredOAuthOrigin} from "./mercado-livre-oauth-local.ts";

const registeredCallback="https://ativa-hub.vercel.app/api/auth/mercado-livre/callback";
test("OAuth localhost é delegado à Vercel e nunca cria callback HTTP",()=>assert.deepEqual(resolveMercadoLivreOAuthContext("http://localhost:3000/api/auth/mercado-livre/start",registeredCallback),{requestOrigin:"http://localhost:3000",origin:"https://ativa-hub.vercel.app",redirectUri:registeredCallback,secureCookie:true,delegateToRegisteredOrigin:true}));
test("OAuth produção permanece na origem Vercel registrada",()=>assert.deepEqual(resolveMercadoLivreOAuthContext("https://ativa-hub.vercel.app/api/auth/mercado-livre/start",registeredCallback),{requestOrigin:"https://ativa-hub.vercel.app",origin:"https://ativa-hub.vercel.app",redirectUri:registeredCallback,secureCookie:true,delegateToRegisteredOrigin:false}));
test("rejeita callback HTTP localhost",()=>assert.throws(()=>resolveMercadoLivreOAuthContext("http://localhost:3000/api/auth/mercado-livre/start","http://localhost:3000/api/auth/mercado-livre/callback"),/registered HTTPS callback/));
test("identifica hosts locais sem classificar produção como local",()=>{assert.equal(isLocalOAuthRequest("http://localhost:3000/api/auth/mercado-livre/start"),true);assert.equal(isLocalOAuthRequest("http://127.0.0.1:3000/api/auth/mercado-livre/start"),true);assert.equal(isLocalOAuthRequest("https://ativa-hub.vercel.app/api/auth/mercado-livre/start"),false)});
test("expõe somente a origem HTTPS configurada para orientação local",()=>{assert.equal(registeredOAuthOrigin(registeredCallback),"https://ativa-hub.vercel.app");assert.equal(registeredOAuthOrigin("http://localhost:3000/callback"),"")});
test("rejeita state inválido",()=>assert.throws(()=>validateOAuthStateData({state:"expected",verifier:"verifier",issuedAt:Date.now(),redirectUri:registeredCallback},"different",registeredCallback),/invalid_state/));
test("rejeita state expirado",()=>assert.throws(()=>validateOAuthStateData({state:"expected",verifier:"verifier",issuedAt:Date.now()-10*60*1000-1,redirectUri:"https://ativa-hub.vercel.app/api/auth/mercado-livre/callback"},"expected","https://ativa-hub.vercel.app/api/auth/mercado-livre/callback"),/expired_state/));
