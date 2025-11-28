declare module 'jwks-rsa' {
  interface JwksRsaOptions {
    jwksUri: string;
    cache?: boolean;
    cacheMaxEntries?: number;
    cacheMaxAge?: number;
  }

  interface JwksRsaClient {
    getSigningKey(kid: string, callback: (err: any, key: any) => void): void;
  }

  function jwksRsa(options: JwksRsaOptions): JwksRsaClient;
  export = jwksRsa;
}
