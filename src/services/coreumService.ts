import { API_CONFIG, BLOCKCHAIN_CONFIG } from '../lib/config';

// Get Coreum config from central configuration
const COREUM_CONFIG = BLOCKCHAIN_CONFIG.COREUM;
const COREUM_RPC_URL = COREUM_CONFIG.rpcUrl;
const COREUM_REST_URL = COREUM_CONFIG.restUrl;

// Whether to use real API or mocks
const USE_REAL_API = API_CONFIG.useRealApi;
const USE_FALLBACK_MOCKS = API_CONFIG.useFallbackMocks;

/**
 * Fetch account balance for a Coreum address
 * @param address Coreum wallet address
 * @returns Promise with balance data
 */
export const getAccountBalance = async (address: string): Promise<any> => {
  try {
    if (USE_REAL_API) {
      // Fetch from the Coreum REST API
      const response = await fetch(`${COREUM_REST_URL}/cosmos/bank/v1beta1/balances/${address}`);
      if (!response.ok) {
        throw new Error(`Error fetching balance: ${response.statusText}`);
      }
      return await response.json();
    } else {
      // For development/testing purposes, return mock data
      console.log('Using mock Coreum balance data');
      return getMockAccountBalance(address);
    }
  } catch (error) {
    console.error('Error fetching Coreum account balance:', error);
    
    // If API call fails and fallback is enabled, use mock data
    if (USE_FALLBACK_MOCKS) {
      console.log('Falling back to mock data after API error');
      return getMockAccountBalance(address);
    }
    
    throw new Error('Failed to fetch Coreum account balance');
  }
};

/**
 * Fetch transaction history for a Coreum address
 * @param address Coreum wallet address
 * @param limit Number of transactions to return (default: 10)
 * @returns Promise with transaction data
 */
export const getTransactionHistory = async (address: string, limit = 10): Promise<any> => {
  try {
    if (USE_REAL_API) {
      // Fetch from the Coreum REST API
      const response = await fetch(`${COREUM_REST_URL}/cosmos/tx/v1beta1/txs?events=message.sender='${address}'&pagination.limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Error fetching transactions: ${response.statusText}`);
      }
      return await response.json();
    } else {
      // For development/testing purposes, return mock data
      console.log('Using mock Coreum transaction data');
      return getMockTransactionHistory(address, limit);
    }
  } catch (error) {
    console.error('Error fetching Coreum transaction history:', error);
    
    // If API call fails and not in production, fall back to mock data
    if (!USE_REAL_API || process.env.NODE_ENV !== 'production') {
      console.log('Falling back to mock data after API error');
      return getMockTransactionHistory(address, limit);
    }
    
    throw new Error('Failed to fetch Coreum transaction history');
  }
};

/**
 * Fetch validator information for Coreum
 * @returns Promise with validator data
 */
export const getValidators = async (): Promise<any> => {
  try {
    // Fetch from the Coreum REST API
    const response = await fetch(`${COREUM_REST_URL}/cosmos/staking/v1beta1/validators?pagination.limit=100`);
    if (!response.ok) {
      throw new Error(`Error fetching validators: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Coreum validators:', error);
    throw new Error('Failed to fetch Coreum validators');
  }
};

/**
 * Get token information for a specific Coreum token
 * @param denom Token denomination
 * @returns Promise with token data
 */
export const getTokenInfo = async (denom: string): Promise<any> => {
  try {
    // Fetch from the Coreum REST API
    const response = await fetch(`${COREUM_REST_URL}/cosmos/bank/v1beta1/denoms_metadata/${denom}`);
    if (!response.ok) {
      throw new Error(`Error fetching token info: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Coreum token info:', error);
    throw new Error('Failed to fetch Coreum token info');
  }
};

// Keeping mock functions for fallback (in case API is down)
const getMockAccountBalance = (address: string): any => {
  return {
    balances: [
      {
        denom: 'ucore',
        amount: '156780000' // 156.78 CORE (micro units)
      },
      {
        denom: 'usdc',
        amount: '250000000' // 250 USDC (micro units)
      }
    ],
    pagination: {
      next_key: null,
      total: '2'
    }
  };
};

// Helper function to generate mock transaction history for demonstration
const getMockTransactionHistory = (address: string, limit: number): any => {
  const txs = [];
  
  for (let i = 0; i < limit; i++) {
    txs.push({
      hash: `${i}abc${address.substring(0, 8)}def${i}`,
      height: '1000' + i,
      tx: {
        body: {
          messages: [
            {
              '@type': '/cosmos.bank.v1beta1.MsgSend',
              from_address: i % 2 === 0 ? address : 'core1randomaddress' + i,
              to_address: i % 2 === 0 ? 'core1randomaddress' + i : address,
              amount: [
                {
                  denom: 'ucore',
                  amount: '1000000' // 1 CORE
                }
              ]
            }
          ]
        }
      },
      tx_result: {
        code: 0, // 0 means success
        log: 'transaction executed successfully'
      },
      timestamp: new Date(Date.now() - i * 3600000).toISOString() // Each tx 1 hour apart
    });
  }
  
  return {
    txs,
    tx_responses: txs.map(tx => ({
      txhash: tx.hash,
      height: tx.height,
      code: 0,
      raw_log: 'transaction executed successfully',
      timestamp: tx.timestamp
    })),
    pagination: {
      next_key: null,
      total: String(limit)
    }
  };
};

// Helper function to generate mock validators for demonstration
const getMockValidators = (): any => {
  const validators = [];
  
  for (let i = 0; i < 10; i++) {
    validators.push({
      operator_address: `corevaloper1random${i}`,
      consensus_pubkey: {
        '@type': '/cosmos.crypto.ed25519.PubKey',
        key: `base64key${i}`
      },
      jailed: false,
      status: 'BOND_STATUS_BONDED',
      tokens: `1000000${i}`,
      delegator_shares: `1000000${i}`,
      description: {
        moniker: `Validator ${i + 1}`,
        identity: '',
        website: `https://validator${i}.example.com`,
        security_contact: '',
        details: `A mock validator ${i + 1} for testing purposes`
      },
      unbonding_height: '0',
      unbonding_time: '1970-01-01T00:00:00Z',
      commission: {
        commission_rates: {
          rate: `0.${i}`,
          max_rate: '0.5',
          max_change_rate: '0.01'
        },
        update_time: '2023-01-01T00:00:00Z'
      }
    });
  }
  
  return {
    validators,
    pagination: {
      next_key: null,
      total: '10'
    }
  };
};

// Helper function to generate mock token info for demonstration
const getMockTokenInfo = (denom: string): any => {
  interface TokenInfo {
    name: string;
    symbol: string;
    decimals: number;
    description: string;
  }

  const tokenInfo: Record<string, TokenInfo> = {
    ucore: {
      name: 'Coreum',
      symbol: 'CORE',
      decimals: 6,
      description: 'Native token of the Coreum blockchain'
    },
    usdc: {
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      description: 'USD pegged stablecoin on Coreum'
    }
  };

  return {
    metadata: {
      description: tokenInfo[denom]?.description || 'Unknown token',
      denom_units: [
        {
          denom: denom,
          exponent: 0,
          aliases: []
        },
        {
          denom: tokenInfo[denom]?.symbol.toLowerCase() || denom,
          exponent: tokenInfo[denom]?.decimals || 6,
          aliases: []
        }
      ],
      base: denom,
      display: tokenInfo[denom]?.symbol || denom,
      name: tokenInfo[denom]?.name || denom,
      symbol: tokenInfo[denom]?.symbol || denom.toUpperCase()
    }
  };
}; 