/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_USE_FALLBACK_MOCKS: string
  readonly VITE_XRP_EXPLORER: string
  readonly VITE_COREUM_EXPLORER: string
  readonly VITE_COINGECKO_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 