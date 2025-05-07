import { config } from '../lib/config';

interface XRPMethodParams {
  account: string;
  [key: string]: any;
}

interface XRPResponse {
  result: any;
  status: string;
}

type MockFunction = () => Promise<any>;

const makeXRPRequest = async (
  method: string,
  params: XRPMethodParams,
  address: string,
  mockFn?: MockFunction
): Promise<XRPResponse> => {
  if (config.features.useMocks && mockFn) {
    return mockFn();
  }

  const response = await fetch(config.api.xrp.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method,
      params: [params],
    }),
  });

  if (!response.ok) {
    throw new Error(`XRP API request failed: ${response.statusText}`);
  }

  return response.json();
};

// Use configuration from config file
const USE_FALLBACK_MOCKS = config.features.useMocks;
const XRP_API_URL = config.api.xrp.baseUrl;
const XRP_TOKEN_DATA_URL = config.api.xrp.tokenDataUrl;

// Always use real API data for production and when explicitly enabled
const USE_REAL_API = true; // Force real API use

// Helper function to handle API calls with fallback to mock data
const fetchXRPLData = async (method, params, address, mockFn) => {
  try {
    console.log(`XRPL DEBUG: Fetching ${method} for ${address} from ${XRP_API_URL}`);
    
    const requestBody = {
      method: method,
      params: [params]
    };
    
    console.log('XRPL DEBUG: Request body:', JSON.stringify(requestBody));
    
    // Use CORS-anywhere proxy for development (optional)
    // const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    // const apiUrl = process.env.NODE_ENV === 'development' ? `${corsProxy}${XRP_API_URL}` : XRP_API_URL;
    
    const response = await fetch(XRP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`XRPL DEBUG: ${method} response:`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error(`Error fetching XRP ${method}:`, error);
    
    if (USE_FALLBACK_MOCKS) {
      console.log(`Falling back to mock data for ${method}`);
      return mockFn(address);
    }
    
    throw new Error(`Failed to fetch XRP ${method}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Fetch account information for an XRP address
 * @param address XRP wallet address
 * @returns Promise with account data
 */
export const getAccountInfo = async (address: string): Promise<any> => {
  return fetchXRPLData('account_info', {
    account: address,
    strict: true,
    ledger_index: 'current'
  }, address, getMockAccountInfo);
};

/**
 * Fetch transaction history for an XRP address
 * @param address XRP wallet address
 * @param limit Number of transactions to return (default: 10)
 * @returns Promise with transaction data
 */
export const getTransactionHistory = async (address: string, limit = 10): Promise<any> => {
  try {
    // Always use real API
    console.log('Fetching real XRP transaction history from', XRP_API_URL);
    const response = await fetch(XRP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'account_tx',
        params: [
          {
            account: address,
            ledger_index_min: -1,
            ledger_index_max: -1,
            binary: false,
            limit: limit
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching XRP transaction history:', error);
    
    // If API call fails and fallback is enabled, use mock data
    if (USE_FALLBACK_MOCKS) {
      console.log('Falling back to mock data after API error');
      return getMockTransactionHistory(address, limit);
    }
    
    throw new Error('Failed to fetch XRP transaction history');
  }
};

/**
 * Get server information from XRP network
 * @returns Promise with server info
 */
export const getServerInfo = async (): Promise<any> => {
  try {
    // In a real implementation, you would make a POST request to the XRP API:
    // const response = await fetch(XRP_API_URL, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     method: 'server_info',
    //     params: [{}]
    //   })
    // });
    // return await response.json();

    // For demonstration purposes, return mock data
    return getMockServerInfo();
  } catch (error) {
    console.error('Error fetching XRP server info:', error);
    throw new Error('Failed to fetch XRP server info');
  }
};

/**
 * Get current ledger information from XRP network
 * @returns Promise with ledger info
 */
export const getLedgerInfo = async (): Promise<any> => {
  try {
    // In a real implementation, you would make a POST request to the XRP API:
    // const response = await fetch(XRP_API_URL, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     method: 'ledger',
    //     params: [
    //       {
    //         ledger_index: 'current',
    //         accounts: false,
    //         full: false,
    //         transactions: false,
    //         expand: false,
    //         owner_funds: false
    //       }
    //     ]
    //   })
    // });
    // return await response.json();

    // For demonstration purposes, return mock data
    return getMockLedgerInfo();
  } catch (error) {
    console.error('Error fetching XRP ledger info:', error);
    throw new Error('Failed to fetch XRP ledger info');
  }
};

/**
 * Fetch trust lines (issued currencies/tokens) for an XRP address
 * @param address XRP wallet address
 * @returns Promise with account lines data
 */
export const getAccountLines = async (address: string): Promise<any> => {
  return fetchXRPLData('account_lines', {
    account: address,
    ledger_index: 'current'
  }, address, getMockAccountLines);
};

/**
 * Get additional token information from xrpscan.com API
 * This provides more detailed token metadata not available from the XRPL directly
 * @param address XRP wallet address
 * @returns Promise with token data
 */
export const getTokenMetadata = async (address: string): Promise<any> => {
  try {
    if (!XRP_TOKEN_DATA_URL) {
      throw new Error('XRP token data URL not configured');
    }
    
    console.log('Fetching XRP token metadata from', XRP_TOKEN_DATA_URL);
    const response = await fetch(`${XRP_TOKEN_DATA_URL}${address}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching XRP token metadata:', error);
    throw new Error('Failed to fetch XRP token metadata');
  }
};

// Helper function to generate mock account info for demonstration
const getMockAccountInfo = (address: string): any => {
  return {
    result: {
      account_data: {
        Account: address,
        Balance: '500000000', // 500 XRP (in drops)
        Flags: 0,
        LedgerEntryType: 'AccountRoot',
        OwnerCount: 2,
        PreviousTxnID: '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF',
        PreviousTxnLgrSeq: 1337,
        Sequence: 42,
        index: '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF'
      },
      ledger_current_index: 1337,
      validated: true
    },
    status: 'success',
    type: 'response'
  };
};

// Helper function to generate mock transaction history for demonstration
const getMockTransactionHistory = (address: string, limit: number): any => {
  const transactions = [];
  
  for (let i = 0; i < limit; i++) {
    transactions.push({
      meta: {
        TransactionIndex: i,
        TransactionResult: 'tesSUCCESS',
        delivered_amount: i % 2 === 0 ? '1000000' : '2000000' // 1 or 2 XRP (in drops)
      },
      tx: {
        Account: i % 2 === 0 ? address : `r${i}RANDOM`,
        Amount: i % 2 === 0 ? '1000000' : '2000000', // 1 or 2 XRP (in drops)
        Destination: i % 2 === 0 ? `r${i}RANDOM` : address,
        Fee: '12',
        Flags: 2147483648,
        LastLedgerSequence: 1337 + i,
        Sequence: 42 + i,
        SigningPubKey: '0123456789ABCDEF',
        TransactionType: 'Payment',
        TxnSignature: 'ABCDEF0123456789',
        date: 712169601 + (i * 86400),
        hash: `${i}ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789`,
        ledger_index: 1337 + i
      },
      validated: true
    });
  }
  
  return {
    result: {
      account: address,
      ledger_index_max: 1337 + limit,
      ledger_index_min: 1337,
      limit: limit,
      transactions: transactions,
      validated: true
    },
    status: 'success',
    type: 'response'
  };
};

// Helper function to generate mock server info for demonstration
const getMockServerInfo = (): any => {
  return {
    result: {
      info: {
        build_version: '1.7.0',
        complete_ledgers: '1337-1500',
        hostid: 'MOCK',
        io_latency_ms: 1,
        jq_trans_overflow: '0',
        last_close: {
          converge_time_s: 2,
          proposers: 5
        },
        load_factor: 1,
        peers: 53,
        pubkey_node: 'n9MOCKPUBKEYNODE',
        server_state: 'full',
        state_accounting: {
          connected: {
            duration_us: '150626655',
            transitions: 1
          },
          disconnected: {
            duration_us: '1528',
            transitions: 1
          },
          full: {
            duration_us: '150626655',
            transitions: 1
          },
          syncing: {
            duration_us: '5202',
            transitions: 1
          }
        },
        uptime: 1729,
        validated_ledger: {
          age: 5,
          base_fee_xrp: 0.00001,
          hash: 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789',
          reserve_base_xrp: 20,
          reserve_inc_xrp: 5,
          seq: 1500
        },
        validation_quorum: 4
      }
    },
    status: 'success',
    type: 'response'
  };
};

// Helper function to generate mock ledger info for demonstration
const getMockLedgerInfo = (): any => {
  return {
    result: {
      ledger: {
        accepted: true,
        account_hash: 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789',
        close_flags: 0,
        close_time: 712169601,
        close_time_human: '2022-Jul-22 00:00:01.000000000 UTC',
        close_time_resolution: 10,
        closed: true,
        ledger_hash: 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789',
        ledger_index: '1500',
        parent_close_time: 712169600,
        parent_hash: 'FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210',
        total_coins: '99999999999999998',
        transaction_hash: '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF'
      },
      ledger_hash: 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789',
      ledger_index: 1500,
      validated: true
    },
    status: 'success',
    type: 'response'
  };
};

// Helper function to generate mock account lines (trust lines) for demonstration
const getMockAccountLines = (address: string): any => {
  return {
    result: {
      account: address,
      ledger_current_index: 1337,
      lines: [
        {
          account: 'rXRPFAKER1111111111111111111',
          balance: '150.0',
          currency: 'USD',
          limit: '1000',
          limit_peer: '0',
          quality_in: 0,
          quality_out: 0
        },
        {
          account: 'rXRPFAKER2222222222222222222',
          balance: '-75.5', // Negative balance (liability)
          currency: 'EUR',
          limit: '500',
          limit_peer: '0',
          quality_in: 0,
          quality_out: 0
        },
        {
          account: 'rXRPFAKER3333333333333333333',
          balance: '200.0',
          currency: 'USDT',
          limit: '1000',
          limit_peer: '0',
          quality_in: 0,
          quality_out: 0
        },
        {
          account: 'rXRPFAKER4444444444444444444',
          balance: '0.0',  // Zero balance should be filtered out
          currency: 'BTC',
          limit: '100',
          limit_peer: '0',
          quality_in: 0,
          quality_out: 0
        },
        {
          account: 'rXRPFAKER5555555555555555555',
          balance: '50.123456', // Testing decimal precision
          currency: 'USDC',
          limit: '1000',
          limit_peer: '0',
          quality_in: 0,
          quality_out: 0
        },
        // Example of a non-standard hex-encoded token (SOLO)
        {
          account: 'rXRPFAKER6666666666666666666',
          balance: '123.45',  
          currency: '534F4C4F00000000000000000000000000000000', // Hex for "SOLO"
          limit: '1000',
          limit_peer: '0',
          quality_in: 0,
          quality_out: 0
        },
        // Another example of a non-standard token
        {
          account: 'rXRPFAKER7777777777777777777',
          balance: '789.01',  
          currency: '5844525000000000000000000000000000000000', // Hex for "XDRP"
          limit: '2000',
          limit_peer: '0',
          quality_in: 0,
          quality_out: 0
        }
      ],
      validated: true
    },
    status: 'success',
    type: 'response'
  };
}; 