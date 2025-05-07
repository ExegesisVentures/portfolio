import * as dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://postgres:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 6543}/postgres`,
  ssl: { rejectUnauthorized: false }
});

/**
 * Main function to check Coreum balances in the database
 */
async function checkCoreumBalances() {
  console.log('Checking Coreum balances in the database...');
  
  const client = await pool.connect();
  
  try {
    // Get all Coreum tokens
    console.log('\nCOREUM TOKENS:');
    const { rows: tokens } = await client.query(`
      SELECT * FROM coreum_tokens ORDER BY symbol;
    `);
    
    console.table(tokens.map(token => ({
      denom: token.denom,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals
    })));
    
    // Get all wallet balances with token information
    console.log('\nWALLET BALANCES:');
    const { rows: balances } = await client.query(`
      SELECT 
        wa.address, 
        ct.symbol, 
        ct.name,
        wb.amount / POW(10, ct.decimals) as balance,
        wb.last_updated
      FROM wallet_balances wb
      JOIN wallet_addresses wa ON wb.wallet_address_id = wa.id
      JOIN coreum_tokens ct ON wb.denom = ct.denom
      ORDER BY wa.address, ct.symbol;
    `);
    
    console.table(balances);
    
    // Calculate total balance value per wallet
    console.log('\nTOTAL BALANCES PER WALLET:');
    const { rows: totalBalances } = await client.query(`
      SELECT 
        wa.address,
        COUNT(wb.id) as token_count,
        MAX(wb.last_updated) as last_updated
      FROM wallet_addresses wa
      LEFT JOIN wallet_balances wb ON wa.id = wb.wallet_address_id
      GROUP BY wa.address
      ORDER BY token_count DESC;
    `);
    
    console.table(totalBalances);
    
  } catch (err) {
    console.error('Error checking Coreum balances:', err);
  } finally {
    client.release();
  }
}

// Execute the check
checkCoreumBalances()
  .then(() => {
    console.log('Script execution complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in script execution:', err);
    process.exit(1);
  }); 