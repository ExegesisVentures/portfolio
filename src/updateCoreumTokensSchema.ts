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
 * Main function to update Coreum tokens schema
 */
async function updateCoreumTokensSchema() {
  console.log('Starting Coreum tokens schema update...');
  
  const client = await pool.connect();
  
  try {
    // Update coreum_tokens table to use larger string lengths
    console.log('Updating coreum_tokens table schema...');
    
    // Alter the symbol column to be 255 characters instead of 50
    await client.query(`
      ALTER TABLE coreum_tokens 
      ALTER COLUMN symbol TYPE VARCHAR(255);
    `);
    
    console.log('Successfully updated symbol column to VARCHAR(255).');
    
    // Alter the name column to be 255 characters instead of 100
    await client.query(`
      ALTER TABLE coreum_tokens 
      ALTER COLUMN name TYPE VARCHAR(255);
    `);
    
    console.log('Successfully updated name column to VARCHAR(255).');
    
    // Display current structure of the table
    console.log('Current structure of coreum_tokens table:');
    const columns = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'coreum_tokens';
    `);
    console.table(columns.rows);
    
    console.log('Coreum tokens schema update completed successfully!');
    
  } catch (err) {
    console.error('Error updating Coreum tokens schema:', err);
  } finally {
    client.release();
  }
}

// Execute the update
updateCoreumTokensSchema()
  .then(() => {
    console.log('Script execution complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in script execution:', err);
    process.exit(1);
  }); 