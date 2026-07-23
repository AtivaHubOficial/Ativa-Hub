export type LogzzErrorCode="LOGZZ_NOT_CONFIGURED"|"LOGZZ_UNAUTHORIZED"|"LOGZZ_RATE_LIMITED"|"LOGZZ_API_ERROR"|"LOGZZ_INVALID_RESPONSE";
export class LogzzError extends Error{readonly code:LogzzErrorCode;readonly status:number;constructor(code:LogzzErrorCode,message:string,status:number){super(message);this.name="LogzzError";this.code=code;this.status=status}}
export const logzzErrorMessage:Record<LogzzErrorCode,string>={
  LOGZZ_NOT_CONFIGURED:"Token da Logzz não configurado.",
  LOGZZ_UNAUTHORIZED:"Não autorizado pela Logzz.",
  LOGZZ_RATE_LIMITED:"Limite de requisições atingido.",
  LOGZZ_API_ERROR:"Não foi possível consultar a Logzz.",
  LOGZZ_INVALID_RESPONSE:"A Logzz retornou dados inválidos.",
};
