import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

// Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables. Ensure VITE_SUPABASE_URL and REACT_APP_SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

// Initialize Supabase client - not used in this script, using direct database connection instead
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
 * Main function to update Coreum token information
 */
async function updateCoreumTokens() {
  console.log('Starting Coreum token information update...');
  
  const client = await pool.connect();
  
  try {
    // Check if coreum_tokens table exists
    console.log('Checking if coreum_tokens table exists...');
    
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'coreum_tokens'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Creating coreum_tokens table...');
      
      await client.query(`
        CREATE TABLE coreum_tokens (
          id SERIAL PRIMARY KEY,
          denom VARCHAR(255) UNIQUE NOT NULL,
          symbol VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          decimals INTEGER DEFAULT 6,
          coingecko_id VARCHAR(100),
          icon_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('Successfully created coreum_tokens table.');
    } else {
      console.log('coreum_tokens table already exists.');
    }
    
    // Add known Coreum tokens
    console.log('Adding/updating known Coreum tokens...');
    
    const coreumTokens = [
      {
        denom: 'ucore',
        symbol: 'CORE',
        name: 'Coreum',
        decimals: 6,
        coingecko_id: 'coreum',
        icon_url: 'https://assets.coingecko.com/coins/images/28132/standard/coreum.png'
      },
      {
        denom: 'usdc',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        coingecko_id: 'usd-coin',
        icon_url: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png'
      },
      {
        denom: 'uusdc',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6, 
        coingecko_id: 'usd-coin',
        icon_url: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png'
      },
      {
        denom: 'ibc/DAE62142CE3ABCAABFC463C84E516F7A635D29EC534BC9D56BF4DF424F9B3D4F',
        symbol: 'USDT',
        name: 'Tether',
        decimals: 6,
        coingecko_id: 'usdt',
        icon_url: 'https://assets.coingecko.com/coins/images/325/standard/tether.png'
      },
      {
        denom: 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858',
        symbol: 'axlUSDC',
        name: 'Axelar USDC',
        decimals: 6,
        coingecko_id: 'axlusdc',
        icon_url: 'https://assets.coingecko.com/coins/images/26476/standard/axlusdc.png'
      },
      {
        denom: 'ibc/FE2CD1E6828EC0FAB8AF39BAC45BC25B965BA67ECBC2F5E00F35D0BB57DFD9C9',
        symbol: 'ATOM',
        name: 'Cosmos',
        decimals: 6,
        coingecko_id: 'atom',
        icon_url: 'https://assets.coingecko.com/coins/images/1481/standard/cosmos_hub.png'
      },
      {
        denom: 'ibc/CD01034D6749E66BFF0B35A2433B02E39BD224B377607B1AF7CABA66D08B42B2',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 6,
        coingecko_id: 'eth-ethereum',
        icon_url: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png'
      }
    ];
    
    for (const token of coreumTokens) {
      await client.query(`
        INSERT INTO coreum_tokens 
          (denom, symbol, name, decimals, coingecko_id, icon_url)
        VALUES 
          ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (denom) 
        DO UPDATE SET 
          symbol = EXCLUDED.symbol,
          name = EXCLUDED.name,
          decimals = EXCLUDED.decimals,
          coingecko_id = EXCLUDED.coingecko_id,
          icon_url = EXCLUDED.icon_url,
          updated_at = NOW();
      `, [token.denom, token.symbol, token.name, token.decimals, token.coingecko_id, token.icon_url]);
    }
    
    console.log('Successfully added/updated Coreum tokens.');
    
    // Next, check if wallet_balances table exists
    console.log('Checking if wallet_balances table exists...');
    
    const balancesTableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'wallet_balances'
      );
    `);
    
    const balancesTableExists = balancesTableCheckResult.rows[0].exists;
    
    if (!balancesTableExists) {
      console.log('Creating wallet_balances table...');
      
      await client.query(`
        CREATE TABLE wallet_balances (
          id SERIAL PRIMARY KEY,
          wallet_address_id INTEGER REFERENCES wallet_addresses(id) ON DELETE CASCADE,
          denom VARCHAR(255) REFERENCES coreum_tokens(denom),
          amount DECIMAL(30, 6) NOT NULL DEFAULT 0,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(wallet_address_id, denom)
        );
      `);
      
      console.log('Successfully created wallet_balances table.');
    } else {
      console.log('wallet_balances table already exists.');
    }
    
    // Create a function to automatically update the last_updated timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_last_updated_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.last_updated = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS update_wallet_balances_last_updated ON wallet_balances;
      
      CREATE TRIGGER update_wallet_balances_last_updated
      BEFORE UPDATE ON wallet_balances
      FOR EACH ROW
      EXECUTE FUNCTION update_last_updated_column();
    `);
    
    console.log('Updated database triggers for wallet_balances table.');
    
    // Display current structure of the tables
    console.log('Current structure of coreum_tokens table:');
    const coreumTokensColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'coreum_tokens';
    `);
    console.table(coreumTokensColumns.rows);
    
    console.log('Current structure of wallet_balances table:');
    const walletBalancesColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'wallet_balances';
    `);
    console.table(walletBalancesColumns.rows);
    
    console.log('Coreum token database update completed successfully!');
    
  } catch (err) {
    console.error('Error updating Coreum token information:', err);
  } finally {
    client.release();
  }
}

// Execute the update
updateCoreumTokens()
  .then(() => {
    console.log('Script execution complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in script execution:', err);
    process.exit(1);
  }); 