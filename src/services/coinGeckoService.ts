import { config } from '../lib/config';

interface CoinGeckoPrice {
  [key: string]: {
    [currency: string]: number;
  };
}

const API_BASE_URL = config.api.coingecko.baseUrl;
const API_KEY = config.api.coingecko.key;

export const getCoinPrice = async (coinId: string, currency = 'usd'): Promise<number> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (API_KEY) {
      headers['x-cg-pro-api-key'] = API_KEY;
    }

    const response = await fetch(
      `${API_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=${currency}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API request failed: ${response.statusText}`);
    }

    const data: CoinGeckoPrice = await response.json();
    return data[coinId]?.[currency] ?? 0;
  } catch (error) {
    console.error('Error fetching coin price:', error);
    return 0;
  }
};

// Interface for CoinGecko prices response
interface PriceData {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

/**
 * Get current prices for multiple cryptocurrencies
 * @param coinIds Array of CoinGecko coin IDs
 * @returns Promise with price data
 */
export const getCoinPrices = async (coinIds: string[]): Promise<PriceData> => {
  try {
    // In a real implementation, you would fetch from the API:
    // const response = await fetch(
    //   `${API_BASE_URL}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
    // );
    // return await response.json();

    // For demonstration purposes, return mock data
    return getMockPriceData(coinIds);
  } catch (error) {
    console.error('Error fetching coin prices:', error);
    throw new Error('Failed to fetch cryptocurrency prices');
  }
};

/**
 * Get detailed information about a specific cryptocurrency
 * @param coinId CoinGecko coin ID
 * @returns Promise with coin data
 */
export const getCoinDetails = async (coinId: string): Promise<any> => {
  try {
    // In a real implementation, you would fetch from the API:
    // const response = await fetch(
    //   `${API_BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&x_cg_api_key=${API_KEY}`
    // );
    // return await response.json();

    // For demonstration purposes, return mock data
    return getMockCoinDetails(coinId);
  } catch (error) {
    console.error('Error fetching coin details:', error);
    throw new Error('Failed to fetch cryptocurrency details');
  }
};

/**
 * Get market data for multiple cryptocurrencies
 * @param coinIds Array of CoinGecko coin IDs
 * @param _ Unused parameter (default: 'usd')
 * @returns Promise with market data
 */
export const getMarketData = async (coinIds: string[], _: string = 'usd'): Promise<any[]> => {
  try {
    // In a real implementation, you would fetch from the API:
    // const response = await fetch(
    //   `${API_BASE_URL}/coins/markets?vs_currency=${_}&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=${coinIds.length}&page=1&sparkline=false&x_cg_api_key=${API_KEY}`
    // );
    // return await response.json();

    // For demonstration purposes, return mock data
    return getMockMarketData(coinIds);
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw new Error('Failed to fetch cryptocurrency market data');
  }
};

// Helper function to generate mock price data for demonstration
const getMockPriceData = (coinIds: string[]): PriceData => {
  const mockData: PriceData = {};
  
  coinIds.forEach(id => {
    switch (id) {
      case 'coreum':
        mockData[id] = { usd: 0.15, usd_24h_change: 2.5 };
        break;
      case 'xrp':
        mockData[id] = { usd: 0.52, usd_24h_change: -1.2 };
        break;
      case 'usd-coin':
        mockData[id] = { usd: 1.0, usd_24h_change: 0.01 };
        break;
      default:
        mockData[id] = { usd: 0.1, usd_24h_change: 0 };
    }
  });
  
  return mockData;
};

// Helper function to generate mock coin details for demonstration
const getMockCoinDetails = (coinId: string): any => {
  switch (coinId) {
    case 'coreum':
      return {
        id: 'coreum',
        symbol: 'core',
        name: 'Coreum',
        market_data: {
          current_price: { usd: 0.15 },
          price_change_percentage_24h: 2.5,
          market_cap: { usd: 75000000 }
        }
      };
    case 'xrp':
      return {
        id: 'xrp',
        symbol: 'xrp',
        name: 'XRP',
        market_data: {
          current_price: { usd: 0.52 },
          price_change_percentage_24h: -1.2,
          market_cap: { usd: 28500000000 }
        }
      };
    default:
      return {
        id: coinId,
        symbol: coinId,
        name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
        market_data: {
          current_price: { usd: 0.1 },
          price_change_percentage_24h: 0,
          market_cap: { usd: 1000000 }
        }
      };
  }
};

// Helper function to generate mock market data for demonstration
const getMockMarketData = (coinIds: string[]): any[] => {
  return coinIds.map(id => {
    switch (id) {
      case 'coreum':
        return {
          id: 'coreum',
          symbol: 'core',
          name: 'Coreum',
          current_price: 0.15,
          price_change_percentage_24h: 2.5,
          market_cap: 75000000,
          total_volume: 5000000,
          image: 'https://assets.coingecko.com/coins/images/25364/large/300x300.png'
        };
      case 'xrp':
        return {
          id: 'xrp',
          symbol: 'xrp',
          name: 'XRP',
          current_price: 0.52,
          price_change_percentage_24h: -1.2,
          market_cap: 28500000000,
          total_volume: 1200000000,
          image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png'
        };
      default:
        return {
          id: id,
          symbol: id.slice(0, 4),
          name: id.charAt(0).toUpperCase() + id.slice(1),
          current_price: 0.1,
          price_change_percentage_24h: 0,
          market_cap: 1000000,
          total_volume: 500000,
          image: 'https://via.placeholder.com/64'
        };
    }
  });
}; 