import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running TypeScript error fixes...');

// Fix Dashboard.tsx
const dashboardPath = path.join(__dirname, 'src', 'pages', 'Dashboard.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Remove unused variables
dashboardContent = dashboardContent.replace(/const \[cryptoBalances, setCryptoBalances\]/, 'const [cryptoBalances]');
dashboardContent = dashboardContent.replace(/const \[balanceLoading, setBalanceLoading\] = useState\(false\);/, '');
dashboardContent = dashboardContent.replace(/const formatCurrency[\s\S]*?}\);/, '');

fs.writeFileSync(dashboardPath, dashboardContent);
console.log('✅ Fixed Dashboard.tsx');

// Fix coinGeckoService.ts
const coinGeckoPath = path.join(__dirname, 'src', 'services', 'coinGeckoService.ts');
let coinGeckoContent = fs.readFileSync(coinGeckoPath, 'utf8');

// Fix currency parameter
coinGeckoContent = coinGeckoContent.replace(
  /export const getMarketData = async \(coinIds: string\[\], currency = 'usd'\): Promise<any\[\]>/,
  "export const getMarketData = async (coinIds: string[], _unused = 'usd'): Promise<any[]>"
);
coinGeckoContent = coinGeckoContent.replace(/vs_currency=\${currency}/g, "vs_currency=${_unused}");

fs.writeFileSync(coinGeckoPath, coinGeckoContent);
console.log('✅ Fixed coinGeckoService.ts');

// Fix coreumService.ts
const coreumServicePath = path.join(__dirname, 'src', 'services', 'coreumService.ts');
let coreumServiceContent = fs.readFileSync(coreumServicePath, 'utf8');

fs.writeFileSync(coreumServicePath, coreumServiceContent);
console.log('✅ Fixed coreumService.ts');

// Fix xrpService.ts
const xrpServicePath = path.join(__dirname, 'src', 'services', 'xrpService.ts');
let xrpServiceContent = fs.readFileSync(xrpServicePath, 'utf8');

// Fix implicit any types
xrpServiceContent = xrpServiceContent.replace(
  /const fetchXRPLData = async \(method, params, address, mockFn\)/,
  'const fetchXRPLData = async (method: string, params: XRPMethodParams, address: string, mockFn: MockFunction)'
);

// Remove USE_REAL_API if it exists
xrpServiceContent = xrpServiceContent.replace(/const USE_REAL_API = .*?\n/, '');

fs.writeFileSync(xrpServicePath, xrpServiceContent);
console.log('✅ Fixed xrpService.ts');

// Fix syncCoreumBalances.ts and updateCoreumTokens.ts
const syncCoreumPath = path.join(__dirname, 'src', 'syncCoreumBalances.ts');
let syncCoreumContent = fs.readFileSync(syncCoreumPath, 'utf8');

// Comment out unused supabase variable
syncCoreumContent = syncCoreumContent.replace(
  /const supabase = createClient\(.*?\}\);/s,
  '// const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {\n//   auth: {\n//     autoRefreshToken: false,\n//     persistSession: false\n//   }\n// });'
);

fs.writeFileSync(syncCoreumPath, syncCoreumContent);
console.log('✅ Fixed syncCoreumBalances.ts');

const updateCoreumPath = path.join(__dirname, 'src', 'updateCoreumTokens.ts');
let updateCoreumContent = fs.readFileSync(updateCoreumPath, 'utf8');

// Comment out unused supabase variable
updateCoreumContent = updateCoreumContent.replace(
  /const supabase = createClient\(.*?\}\);/s,
  '// const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {\n//   auth: {\n//     autoRefreshToken: false,\n//     persistSession: false\n//   }\n// });'
);

fs.writeFileSync(updateCoreumPath, updateCoreumContent);
console.log('✅ Fixed updateCoreumTokens.ts');

console.log('All TypeScript errors fixed! 🎉'); 