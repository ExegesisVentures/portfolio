import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Coreum REST API URL
const COREUM_REST_URL = 'https://rest-coreum.ecostake.com';

// Function to get account balance from Coreum
async function getAccountBalance(address: string): Promise<any> {
  try {
    const response = await axios.get(`${COREUM_REST_URL}/cosmos/bank/v1beta1/balances/${address}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Coreum account balance:', error);
    throw new Error('Failed to fetch Coreum account balance');
  }
}

// Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables. Ensure VITE_SUPABASE_URL and REACT_APP_SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

// Initialize Supabase client - only if needed for direct Supabase operations
// If not used, we can remove this initialization
// const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
//   auth: {
//     autoRefreshToken: false,
//     persistSession: false
//   }
// });

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://postgres:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 6543}/postgres`,
  ssl: { rejectUnauthorized: false }
});

/**
 * Main function to sync Coreum wallet balances to Supabase
 */
async function syncCoreumBalances() {
  console.log('Starting Coreum wallet balance synchronization...');
  
  const client = await pool.connect();
  
  try {
    // Get all wallet addresses from the database
    console.log('Fetching wallet addresses...');
    
    const { rows: walletAddresses } = await client.query(`
      SELECT id, address FROM wallet_addresses
    `);
    
    console.log(`Found ${walletAddresses.length} wallet addresses.`);
    
    // For each wallet address, fetch balances from the blockchain and update the database
    for (const wallet of walletAddresses) {
      try {
        // Check if address appears to be a Coreum address (starts with 'core')
        if (!wallet.address.startsWith('core')) {
          console.log(`Skipping non-Coreum wallet: ${wallet.address}`);
          continue;
        }
        
        console.log(`Syncing balances for wallet: ${wallet.address}`);
        
        // Fetch account balances from Coreum blockchain
        const accountData = await getAccountBalance(wallet.address);
        
        if (!accountData.balances || accountData.balances.length === 0) {
          console.log(`No balances found for wallet: ${wallet.address}`);
          continue;
        }
        
        // Get all known denominations from coreum_tokens table
        const { rows: knownTokens } = await client.query(`
          SELECT denom FROM coreum_tokens
        `);
        
        const knownDenoms = knownTokens.map(token => token.denom);
        
        // Process each balance
        for (const balance of accountData.balances) {
          const denom = balance.denom;
          const amount = parseFloat(balance.amount);
          
          // If the denomination is not in our database, add it with default values
          if (!knownDenoms.includes(denom)) {
            console.log(`Adding new token to database: ${denom}`);
            
            let symbol = denom;
            let name = denom;
            
            // Try to derive a better name/symbol for unknown tokens
            if (denom.startsWith('ibc/')) {
              symbol = `IBC-${denom.substring(4, 8)}`;
              name = `IBC Token ${denom.substring(4, 12)}`;
            } else if (denom.includes('-')) {
              // Some Coreum assets are named like 'asset-SYMBOL' or similar
              symbol = denom.split('-')[1];
              name = `Coreum ${symbol}`;
            }
            
            await client.query(`
              INSERT INTO coreum_tokens 
                (denom, symbol, name, decimals)
              VALUES 
                ($1, $2, $3, 6)
              ON CONFLICT (denom) DO NOTHING;
            `, [denom, symbol, name]);
          }
          
          // Update or insert the balance
          await client.query(`
            INSERT INTO wallet_balances 
              (wallet_address_id, denom, amount)
            VALUES 
              ($1, $2, $3)
            ON CONFLICT (wallet_address_id, denom) 
            DO UPDATE SET 
              amount = EXCLUDED.amount,
              last_updated = NOW();
          `, [wallet.id, denom, amount]);
        }
        
        console.log(`Successfully synced balances for wallet: ${wallet.address}`);
      } catch (err) {
        console.error(`Error syncing balances for wallet ${wallet.address}:`, err);
      }
    }
    
    console.log('Coreum wallet balance synchronization completed successfully!');
    
  } catch (err) {
    console.error('Error syncing Coreum wallet balances:', err);
  } finally {
    client.release();
  }
}

// Execute the sync
syncCoreumBalances()
  .then(() => {
    console.log('Script execution complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in script execution:', err);
    process.exit(1);
  }); 