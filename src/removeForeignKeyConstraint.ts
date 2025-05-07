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

async function removeForeignKeyConstraint() {
  const client = await pool.connect();

  try {
    console.log('Connected to database. Checking if foreign key constraint exists...');
    
    // First, check if the foreign key constraint exists
    const checkConstraintQuery = `
      SELECT conname
      FROM pg_constraint
      WHERE conname = 'wallet_addresses_user_id_fkey';
    `;
    
    const checkResult = await client.query(checkConstraintQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('The foreign key constraint exists. Removing it now...');
      
      // Drop the foreign key constraint
      const dropConstraintQuery = `
        ALTER TABLE wallet_addresses
        DROP CONSTRAINT wallet_addresses_user_id_fkey;
      `;
      
      await client.query(dropConstraintQuery);
      console.log('Successfully removed foreign key constraint.');
    } else {
      console.log('The specified foreign key constraint was not found.');
      
      // List all constraints on the wallet_addresses table
      console.log('Listing all constraints on wallet_addresses table:');
      const listConstraintsQuery = `
        SELECT conname
        FROM pg_constraint
        JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
        WHERE pg_class.relname = 'wallet_addresses';
      `;
      
      const constraintsResult = await client.query(listConstraintsQuery);
      console.table(constraintsResult.rows);
      
      if (constraintsResult.rows.length > 0) {
        // Try to detect if there's a different name for the user_id FK constraint
        const userIdConstraints = constraintsResult.rows.filter((row: any) => 
          row.conname.includes('user_id') || row.conname.includes('fkey')
        );
        
        if (userIdConstraints.length > 0) {
          console.log(`Found possible user_id foreign key constraint: ${userIdConstraints[0].conname}`);
          const dropCustomConstraintQuery = `
            ALTER TABLE wallet_addresses
            DROP CONSTRAINT "${userIdConstraints[0].conname}";
          `;
          
          await client.query(dropCustomConstraintQuery);
          console.log(`Successfully removed constraint: ${userIdConstraints[0].conname}`);
        }
      }
    }
    
    // Check the table columns
    console.log('Current structure of wallet_addresses table:');
    const tableStructureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
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

removeForeignKeyConstraint(); 