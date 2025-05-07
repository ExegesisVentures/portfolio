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
    if (config.features.useMocks) {
      // Use the mock data function
      return {
        validators: [],
        pagination: {
          next_key: null,
          total: '0'
        }
      };
    }

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
    if (config.features.useMocks) {
      return {
        metadata: {
          description: 'Mock token data',
          denom_units: [
            {
              denom: denom,
              exponent: 0,
              aliases: []
            }
          ],
          base: denom,
          display: denom.toUpperCase(),
          name: denom,
          symbol: denom.toUpperCase()
        }
      };
    }

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