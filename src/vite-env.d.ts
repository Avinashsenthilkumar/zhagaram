/// <reference types="vite/client" />

declare module "virtual:grok-og-identity" {
  export const grokOgIdentity: {
    site?: {
      name?: string;
      url?: string;
      title?: string;
      description?: string;
      image?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}