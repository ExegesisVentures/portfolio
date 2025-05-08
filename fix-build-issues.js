import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing TypeScript build issues...');

// Fix 1: Update TransactionHistory component
const transactionHistoryPath = path.join(__dirname, 'src', 'components', 'TransactionHistory.tsx');
if (fs.existsSync(transactionHistoryPath)) {
  let content = fs.readFileSync(transactionHistoryPath, 'utf8');
  content = content.replace(/txResponse\.txs/g, 'txResponse.transactions');
  fs.writeFileSync(transactionHistoryPath, content);
  console.log('✅ Fixed TransactionHistory.tsx');
}

// Fix 2: Fix useWalletData hook
const useWalletDataPath = path.join(__dirname, 'src', 'hooks', 'useWalletData.ts');
if (fs.existsSync(useWalletDataPath)) {
  let content = fs.readFileSync(useWalletDataPath, 'utf8');
  
  // Fix getAccountBalance -> getBalance
  content = content.replace(/getAccountBalance/g, 'getBalance');
  
  // Fix balance structure issue
  content = content.replace(
    /const accountData = await coreumService\.getBalance\(address\);/,
    `const balanceData = await coreumService.getBalance(address);
      
      // Create the expected structure for the balance data
      const accountData = {
        balances: [{
          denom: 'ucore',
          amount: balanceData.balance
        }]
      };`
  );
  
  // Fix if check for balances
  content = content.replace(
    /if \(!accountData\.balances \|\| accountData\.balances\.length === 0\) {/,
    `if (!balanceData || !balanceData.balance) {`
  );
  
  // Fix all price_change_24h type issues
  content = content.replace(
    /const price_change_24h = .*?;/g,
    `const price_change_24h = Number(coinId && priceData[coinId]?.usd_24h_change || 0);`
  );
  
  // Fix type issues with reduce and assignments
  content = content.replace(
    /const total = processedBalances\.reduce\(\(sum: number, item: CryptoBalance\) => sum \+ item\.value_usd, 0\);/g,
    `const total = processedBalances.reduce((sum, item) => sum + (Number(item.value_usd) || 0), 0);`
  );
  
  // Make sure price_change_24h for XRP is a number too
  content = content.replace(
    /const xrp_price_change_24h = priceData\.xrp\?\.usd_24h_change \|\| 0;/,
    `const xrp_price_change_24h = Number(priceData.xrp?.usd_24h_change || 0);`
  );
  
  // Make price_change_24h always 0 for trust lines
  content = content.replace(
    /price_change_24h: 0/g,
    `price_change_24h: 0`
  );
  
  fs.writeFileSync(useWalletDataPath, content);
  console.log('✅ Fixed useWalletData.ts');
}

// Fix 3: Fix supabase.ts config property name
const supabasePath = path.join(__dirname, 'src', 'lib', 'supabase.ts');
if (fs.existsSync(supabasePath)) {
  let content = fs.readFileSync(supabasePath, 'utf8');
  
  // Fix anonKey -> apiKey
  content = content.replace(/SUPABASE_CONFIG\.anonKey/, 'SUPABASE_CONFIG.apiKey');
  
  fs.writeFileSync(supabasePath, content);
  console.log('✅ Fixed supabase.ts');
}

// Fix 4: Add missing types or interfaces to lib/config.ts
const configPath = path.join(__dirname, 'src', 'lib', 'config.ts');
if (fs.existsSync(configPath)) {
  let content = fs.readFileSync(configPath, 'utf8');
  
  // Add proper typing to SUPABASE_CONFIG
  if (content.includes('export const SUPABASE_CONFIG') && !content.includes('apiKey')) {
    content = content.replace(
      /export const SUPABASE_CONFIG = {/,
      `export const SUPABASE_CONFIG: { url: string, apiKey: string } = {`
    );
    content = content.replace(/apiKey:/, 'apiKey:');
  }
  
  fs.writeFileSync(configPath, content);
  console.log('✅ Fixed config.ts');
}

// Fix 5: Fix xrpService.ts transaction typing
const xrpServicePath = path.join(__dirname, 'src', 'services', 'xrpService.ts');
if (fs.existsSync(xrpServicePath)) {
  let content = fs.readFileSync(xrpServicePath, 'utf8');
  
  // Define transaction type
  const transactionType = `
// Define transaction type to fix 'never' type error
interface XRPTransaction {
  meta: {
    TransactionIndex: number;
    TransactionResult: string;
    delivered_amount: string;
  };
  tx: {
    Account: string;
    Amount: string;
    Destination: string;
    Fee: string;
    Flags: number;
    LastLedgerSequence: number;
    Sequence: number;
    SigningPubKey: string;
    TransactionType: string;
    TxnSignature: string;
    date: number;
    hash: string;
    ledger_index: number;
  };
  validated: boolean;
}

// Helper function to generate mock transaction history for demonstration`;

  content = content.replace(
    /\/\/ Helper function to generate mock transaction history for demonstration/,
    transactionType
  );
  
  // Fix transaction push by specifying the array type
  content = content.replace(
    /const transactions = \[\];/,
    `const transactions: XRPTransaction[] = [];`
  );
  
  fs.writeFileSync(xrpServicePath, content);
  console.log('✅ Fixed xrpService.ts');
}

console.log('✅ All build issues fixed!'); 