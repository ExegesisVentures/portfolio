// src/lib/config.ts
// Database configuration
export const DB_CONFIG = {
  host: 'db.rqpkqunkpgccxmdxksxn.supabase.co',
  port: 6543,
  database: 'postgres',
  user: 'postgres',
  password: 'ERUedVd7zUtUk12n',
  connectionString: 'postgres://postgres:ERUedVd7zUtUk12n@db.rqpkqunkpgccxmdxksxn.supabase.co:6543/postgres',
  poolMode: 'transaction'
};

// Environment variables helper function (handles both Vite and CRA formats)
const getEnv = (key: string, defaultValue: string = '') => {
  // Vite uses import.meta.env
  if (typeof import.meta.env === 'object') {
    return import.meta.env[key] || defaultValue;
  }
  // Create React App uses process.env
  // @ts-ignore - for environments that use process.env
  return process.env?.[key] || defaultValue;
};

// Development/production mode check
const IS_PRODUCTION = getEnv('NODE_ENV') === 'production';

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL') || 'https://your-project-url.supabase.co',
  apiKey: getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_KEY') || 'your-supabase-anon-key',
};

// Global API configuration
export const API_CONFIG = {
  // Whether to use real API or mocks - true in production or when explicitly enabled
  useRealApi: getEnv('REACT_APP_USE_REAL_API') === 'true' || IS_PRODUCTION,
  
  // Should we fall back to mock data if API calls fail?
  useFallbackMocks: getEnv('REACT_APP_USE_FALLBACK_MOCKS') !== 'false',
};

// Blockchain-specific configurations
export const BLOCKCHAIN_CONFIG = {
  // XRP Ledger configuration
  XRP: {
    apiUrl: getEnv('REACT_APP_XRP_API_URL') || 
      (IS_PRODUCTION 
        ? 'https://xrplcluster.com'  // Public XRPL cluster
        : 'https://xahaucluster.com'),  // Alternative public node
    explorer: getEnv('REACT_APP_XRP_EXPLORER') || 'https://xrpscan.com/account/',
    features: ['Fast finality', 'Low fees', 'DEX'],
    nativeToken: 'XRP',
    decimals: 6,
    // Optional alternative API for token metadata (Sologenic/xrpscan)
    tokenDataUrl: getEnv('REACT_APP_XRP_TOKEN_DATA_URL') || 'https://api.xrpscan.com/api/v1/account/',
  },
  
  // Coreum configuration
  COREUM: {
    rpcUrl: getEnv('REACT_APP_COREUM_RPC_URL') || 'https://rest-coreum.ecostake.com',
    restUrl: getEnv('REACT_APP_COREUM_REST_URL') || 'https://rest-coreum.ecostake.com',
    explorer: getEnv('REACT_APP_COREUM_EXPLORER') || 'https://explorer.mainnet.coreum.dev/coreum/accounts/',
    features: ['Smart Contracts', 'Token Issuance', 'Staking'],
    nativeToken: 'CORE',
    decimals: 6,
  },
};

// Function to get configuration for any supported blockchain
export const getBlockchainConfig = (blockchain: string) => {
  const upperBlockchain = blockchain.toUpperCase();
  if (BLOCKCHAIN_CONFIG[upperBlockchain as keyof typeof BLOCKCHAIN_CONFIG]) {
    return BLOCKCHAIN_CONFIG[upperBlockchain as keyof typeof BLOCKCHAIN_CONFIG];
  }
  throw new Error(`Unsupported blockchain: ${blockchain}`);
}; 