import { config } from '../lib/config';

interface CoreumBalance {
  address: string;
  balance: string;
}

interface CoreumValidator {
  address: string;
  details: string;
}

interface CoreumTokenInfo {
  symbol: string;
  name: string;
  decimals: number;
}

interface TransactionHistory {
  transactions: any[];
  pagination: {
    next_key: string | null;
    total: string;
  };
}

const COREUM_REST_URL = config.api.coreum.restUrl;

export const getBalance = async (address: string): Promise<CoreumBalance> => {
  if (config.features.useMocks) {
    return getMockBalance(address);
  }

  const response = await fetch(`${COREUM_REST_URL}/cosmos/bank/v1beta1/balances/${address}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Coreum balance: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    address,
    balance: data.balances?.[0]?.amount ?? '0',
  };
};

const getMockBalance = (address: string): CoreumBalance => {
  return {
    address,
    balance: '1000000',
  };
};

export const getTransactionHistory = async (address: string, limit = 10): Promise<TransactionHistory> => {
  try {
    if (!config.features.useMocks) {
      const response = await fetch(
        `${COREUM_REST_URL}/cosmos/tx/v1beta1/txs?events=message.sender='${address}'&pagination.limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transaction history: ${response.statusText}`);
      }
      
      return response.json();
    }
    
    return getMockTransactionHistory(address, limit);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return getMockTransactionHistory(address, limit);
  }
};

const getMockTransactionHistory = (address: string, limit: number): TransactionHistory => {
  return {
    transactions: Array(limit).fill({
      hash: '0x123...abc',
      timestamp: new Date().toISOString(),
      amount: '1000000',
      type: 'transfer',
    }),
    pagination: {
      next_key: null,
      total: String(limit),
    },
  };
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