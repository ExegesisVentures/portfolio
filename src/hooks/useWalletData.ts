import { useState, useEffect } from 'react';
import * as coreumService from '../services/coreumService';
import * as xrpService from '../services/xrpService';
import { getCoinPrices } from '../services/coinGeckoService';
import { supabase } from '../lib/supabaseClient';

interface WalletData {
  balances: CryptoBalance[];
  totalValue: number;
  loading: boolean;
  error: string | null;
}

export interface CryptoBalance {
  symbol: string;
  name: string;
  balance: number;
  value_usd: number;
  price_usd: number;
  price_change_24h: number;
}

interface TokenData {
  denom: string;
  symbol: string;
  name: string;
  decimals: number;
  coingecko_id: string | null;
  icon_url: string | null;
}

// Define the structure as it's returned from Supabase
interface DbWalletBalance {
  amount: string;
  coreum_tokens: {
    denom: string;
    symbol: string;
    name: string;
    decimals: number;
    coingecko_id: string | null;
    icon_url: string | null;
  };
}

/**
 * Custom hook to fetch and process wallet data based on blockchain type and address
 * @param blockchain The blockchain type (COREUM or XRP)
 * @param address The wallet address
 * @returns Object containing balances, loading state, and error information
 */
export const useWalletData = (blockchain: string, address: string): WalletData => {
  const [balances, setBalances] = useState<CryptoBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState<number>(0);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchWalletData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch data based on blockchain type
        if (blockchain === 'COREUM') {
          await fetchCoreumData(address);
        } else if (blockchain === 'XRP') {
          await fetchXrpData(address);
        } else {
          throw new Error(`Unsupported blockchain: ${blockchain}`);
        }
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setBalances([]);
        setTotalValue(0);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [blockchain, address]);

  const fetchCoreumData = async (address: string) => {
    try {
      // First try to get data from our database
      const { data: walletAddress } = await supabase
        .from('wallet_addresses')
        .select('id')
        .eq('address', address)
        .single();
      
      if (walletAddress) {
        // Get balances from database
        const { data: dbBalances, error: dbError } = await supabase
          .from('wallet_balances')
          .select(`
            amount,
            coreum_tokens (
              denom,
              symbol,
              name,
              decimals,
              coingecko_id,
              icon_url
            )
          `)
          .eq('wallet_address_id', walletAddress.id);
        
        if (dbBalances && dbBalances.length > 0) {
          console.log('Using cached wallet balances from database');
          
          // Get coin IDs for price lookup
          const coinIds = (dbBalances as unknown as DbWalletBalance[])
            .map(item => item.coreum_tokens.coingecko_id)
            .filter(Boolean) as string[];
          
          // Get prices from CoinGecko
          const priceData = await getCoinPrices(coinIds);
          
          // Process balances with prices
          const processedBalances = (dbBalances as unknown as DbWalletBalance[]).map(item => {
            const coinId = item.coreum_tokens.coingecko_id;
            const price_usd = coinId && priceData[coinId]?.usd ? priceData[coinId].usd : 0;
            const price_change_24h = Number(coinId && priceData[coinId]?.usd_24h_change || 0);
            
            const balance = parseFloat(item.amount) / Math.pow(10, item.coreum_tokens.decimals);
            const value_usd = balance * price_usd;
            
            return {
              symbol: item.coreum_tokens.symbol,
              name: item.coreum_tokens.name,
              balance,
              value_usd,
              price_usd,
              price_change_24h
            };
          });
          
          // Calculate total value
          const total = processedBalances.reduce((sum, item) => sum + (item.value_usd || 0), 0);
          
          setBalances(processedBalances);
          setTotalValue(total);
          return;
        }
      }
      
      // If no data in database or error, fall back to blockchain API
      console.log('No cached data found, fetching from blockchain...');
      
      // Get balances from Coreum
      const balanceData = await coreumService.getBalance(address);
      
      if (!balanceData || !balanceData.balance) {
        setBalances([]);
        setTotalValue(0);
        return;
      }
      
      // Convert the single balance to the expected format
      const accountData = {
        balances: [{
          denom: 'ucore', // Default to ucore
          amount: balanceData.balance
        }]
      };
      
      // Get token info from database
      const { data: tokenData } = await supabase
        .from('coreum_tokens')
        .select('*');
      
      // Create a map of denom to token info
      const tokenMap = tokenData ? (tokenData as TokenData[]).reduce((map: Record<string, TokenData>, token: TokenData) => {
        map[token.denom] = token;
        return map;
      }, {}) : {};
      
      // Get coin mappings for price lookup
      const coinIds = tokenData
        ? (tokenData as TokenData[])
            .filter(token => token.coingecko_id)
            .map(token => token.coingecko_id)
            .filter(Boolean) as string[]
        : [];
      
      // Get prices from CoinGecko
      const priceData = await getCoinPrices(coinIds);
      
      // Process balance data with prices
      const processedBalances = accountData.balances.map((balance: any) => {
        const denom = balance.denom;
        
        // Default token metadata
        let symbol = denom;
        let name = denom;
        let decimals = 6; // Default to 6 decimals
        let coinId: string | null = null;
        
        // Get token info from our database if available
        if (tokenMap[denom]) {
          symbol = tokenMap[denom].symbol;
          name = tokenMap[denom].name;
          decimals = tokenMap[denom].decimals;
          coinId = tokenMap[denom].coingecko_id;
        } else {
          // Try to derive a better name/symbol for unknown tokens
          if (denom === 'ucore') {
            symbol = 'CORE';
            name = 'Coreum';
          } else if (denom === 'usdc' || denom === 'uusdc') {
            symbol = 'USDC';
            name = 'USD Coin';
          } else if (denom.startsWith('ibc/')) {
            symbol = `IBC-${denom.substring(4, 8)}`;
            name = `IBC Token ${denom.substring(4, 12)}`;
          } else if (denom.includes('-')) {
            // Some Coreum assets are named like 'asset-SYMBOL' or similar
            const parts = denom.split('-');
            if (parts.length > 1) {
              const prefix = parts[0].replace(/^u/, ''); // Remove 'u' prefix if it exists
              symbol = prefix.toUpperCase();
              name = `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Token`;
            }
          }
        }
        
        const rawBalance = parseFloat(balance.amount);
        const tokenBalance = rawBalance / Math.pow(10, decimals);
        
        const price_usd = coinId && priceData[coinId]?.usd ? priceData[coinId].usd : 0;
        const price_change_24h = Number(coinId && priceData[coinId]?.usd_24h_change || 0);
        const value_usd = tokenBalance * price_usd;
        
        return {
          symbol,
          name,
          balance: tokenBalance,
          value_usd,
          price_usd,
          price_change_24h
        };
      });
      
      // Calculate total value
      const total = processedBalances.reduce((sum, item) => sum + (item.value_usd || 0), 0);
      
      setBalances(processedBalances);
      setTotalValue(total);
      
    } catch (error) {
      console.error('Error in fetchCoreumData:', error);
      throw error;
    }
  };

  const fetchXrpData = async (address: string) => {
    try {
      setLoading(true);
      console.log('Fetching real XRP data for address:', address);
      
      // Get account info from XRP Ledger for native XRP balance
      const accountInfo = await xrpService.getAccountInfo(address);
      
      if (!accountInfo.result || !accountInfo.result.account_data) {
        console.error('No XRP account data found or error in response:', accountInfo);
        setBalances([]);
        setTotalValue(0);
        setLoading(false);
        return;
      }

      // Get account lines (trust lines) for other tokens/assets
      const accountLines = await xrpService.getAccountLines(address);
      
      // Log the raw data for debugging
      console.log('XRP account data:', accountInfo.result.account_data);
      console.log('XRP trust lines:', accountLines.result?.lines || []);
      
      // Get price data for XRP
      const priceData = await getCoinPrices(['xrp']);
      
      // Parse the balances array
      const processedBalances: CryptoBalance[] = [];
      
      // 1. Add native XRP balance
      if (accountInfo.result.account_data.Balance) {
        const balance = accountInfo.result.account_data.Balance;
        const xrpBalance = parseFloat(balance) / 1000000; // XRP uses 6 decimals (drops)
        const xrp_price_usd = priceData.xrp?.usd || 0.5; // Default to $0.50 if price not available
        const xrp_price_change_24h = priceData.xrp?.usd_24h_change || 0;
        const xrp_value_usd = xrpBalance * xrp_price_usd;

        processedBalances.push({
          symbol: 'XRP',
          name: 'XRP',
          balance: xrpBalance,
          value_usd: xrp_value_usd,
          price_usd: xrp_price_usd,
          price_change_24h: xrp_price_change_24h
        });
      }
      
      // 2. Add tokens from trust lines (if any)
      if (accountLines.result?.lines && Array.isArray(accountLines.result.lines)) {
        for (const line of accountLines.result.lines) {
          try {
            // Only process lines with positive balances
            const balance = parseFloat(line.balance);
            if (balance <= 0) continue;
            
            // Get the currency and issuer
            const currency = line.currency;
            const issuer = line.account;
            
            // Format the symbol and name
            let symbol = currency;
            // For hex currencies, try to convert to ASCII
            if (currency.length > 3 && /^[0-9A-F]+$/i.test(currency)) {
              try {
                let ascii = '';
                for (let i = 0; i < currency.length; i += 2) {
                  const hex = currency.substring(i, i + 2);
                  const char = String.fromCharCode(parseInt(hex, 16));
                  if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) {
                    ascii += char;
                  }
                }
                if (ascii.trim()) {
                  symbol = ascii.trim().replace(/\u0000/g, '');
                }
              } catch (e) {
                // If conversion fails, keep original
              }
            }
            
            // Short name for the issuer
            const issuerShort = issuer.substring(0, 4) + '...' + issuer.substring(issuer.length - 4);
            
            // Add the token to our balances
            processedBalances.push({
              symbol: symbol,
              name: `${symbol} (${issuerShort})`,
              balance: balance,
              value_usd: 0, // We don't have price info for most tokens
              price_usd: 0,
              price_change_24h: 0
            });
          } catch (e) {
            console.error('Error processing trust line:', e, line);
          }
        }
      }
      
      // Calculate total value (mostly just XRP value since we don't have prices for other tokens)
      const totalValue = processedBalances.reduce((sum, item) => sum + item.value_usd, 0);
      
      console.log('Final processed XRP balances:', processedBalances);
      
      setBalances(processedBalances);
      setTotalValue(totalValue);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchXrpData:', error);
      setError('Failed to fetch XRP wallet data');
      setBalances([]);
      setTotalValue(0);
      setLoading(false);
    }
  };

  return {
    balances,
    totalValue,
    loading,
    error
  };
}; 