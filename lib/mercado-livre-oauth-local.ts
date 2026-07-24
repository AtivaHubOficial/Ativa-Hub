export function isLocalOAuthRequest(requestUrl: string) {
  const hostname = new URL(requestUrl).hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function registeredOAuthOrigin(configuredRedirectUri?: string) {
  try {
    const url = new URL(configuredRedirectUri ?? "");
    return url.protocol === "https:" ? url.origin : "";
  } catch {
    return "";
  }
}
