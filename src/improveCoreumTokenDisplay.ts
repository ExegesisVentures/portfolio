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
 * Main function to improve Coreum token display names
 */
async function improveCoreumTokenDisplay() {
  console.log('Starting improvement of Coreum token display names...');
  
  const client = await pool.connect();
  
  try {
    // Get all Coreum tokens with long symbols
    console.log('Fetching tokens with long names...');
    
    const { rows: tokensToImprove } = await client.query(`
      SELECT id, denom, symbol, name 
      FROM coreum_tokens
      WHERE length(symbol) > 20
      ORDER BY denom;
    `);
    
    console.log(`Found ${tokensToImprove.length} tokens with long display names.`);
    
    // Improve each token's display
    for (const token of tokensToImprove) {
      let newSymbol = token.symbol;
      let newName = token.name;
      
      // Handle different token types
      if (token.denom.startsWith('drop-')) {
        newSymbol = 'DROP';
        newName = 'CryptoDrops Token';
      } else if (token.denom.startsWith('xrpl')) {
        newSymbol = 'XRPL';
        newName = 'XRPL Bridge Token';
      } else if (token.denom.startsWith('ukong-')) {
        newSymbol = 'KONG';
        newName = 'Kong Token';
      } else if (token.denom.startsWith('uawktuah-')) {
        newSymbol = 'AWKTUAH';
        newName = 'Awktuah Token';
      } else if (token.denom.startsWith('usara-')) {
        newSymbol = 'SARA';
        newName = 'Sara Token';
      } else if (token.denom.includes('-')) {
        // Extract a better symbol from the denom
        const parts = token.denom.split('-');
        if (parts.length > 1) {
          const prefix = parts[0].replace(/^u/, ''); // Remove 'u' prefix if it exists
          newSymbol = prefix.toUpperCase();
          newName = `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Token`;
        }
      }
      
      console.log(`Updating token ${token.denom}:`);
      console.log(`  Symbol: ${token.symbol} -> ${newSymbol}`);
      console.log(`  Name: ${token.name} -> ${newName}`);
      
      // Update the token in the database
      await client.query(`
        UPDATE coreum_tokens
        SET symbol = $1, name = $2, updated_at = NOW()
        WHERE id = $3;
      `, [newSymbol, newName, token.id]);
    }
    
    // Get all tokens after updates
    console.log('\nUPDATED COREUM TOKENS:');
    const { rows: updatedTokens } = await client.query(`
      SELECT denom, symbol, name, decimals 
      FROM coreum_tokens 
      ORDER BY symbol;
    `);
    
    console.table(updatedTokens);
    
    console.log('Token display improvement completed successfully!');
    
  } catch (err) {
    console.error('Error improving token display:', err);
  } finally {
    client.release();
  }
}

// Execute the update
improveCoreumTokenDisplay()
  .then(() => {
    console.log('Script execution complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in script execution:', err);
    process.exit(1);
  }); 