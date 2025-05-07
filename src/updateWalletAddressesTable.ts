import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: {
    rejectUnauthorized: false,
  },
});

async function updateWalletAddressesTable() {
  const client = await pool.connect();

  try {
    console.log('Connected to database. Checking wallet_addresses table structure...');
    
    // First, check if the blockchain column exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'wallet_addresses' 
      AND column_name = 'blockchain';
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('The blockchain column does not exist in wallet_addresses table. Adding it now...');
      
      // Add the blockchain column
      const addColumnQuery = `
        ALTER TABLE wallet_addresses
        ADD COLUMN blockchain TEXT;
      `;
      
      await client.query(addColumnQuery);
      console.log('Successfully added blockchain column to wallet_addresses table.');
    } else {
      console.log('The blockchain column already exists in wallet_addresses table.');
    }
    
    // Display the current structure of the table
    console.log('Current structure of wallet_addresses table:');
    const tableStructureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'wallet_addresses';
    `;
    
    const structureResult = await client.query(tableStructureQuery);
    console.table(structureResult.rows);
    
  } catch (err) {
    console.error('Error updating wallet_addresses table:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateWalletAddressesTable(); 