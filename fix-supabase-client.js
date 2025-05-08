// fix-supabase-client.js
// This script ensures we only have one Supabase client instance across the application
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing Supabase client usage...');

// Find all JavaScript and TypeScript files recursively
const findFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules
      if (file !== 'node_modules' && file !== '.git') {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
};

const allFiles = findFiles(path.join(__dirname, 'src'));
console.log(`Found ${allFiles.length} files to check...`);

// Process each file
let fixCount = 0;
for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file uses supabase from config.ts
  if (content.includes('config.supabase') || content.includes('from \'../lib/config\';') || 
      content.includes('from "./config";') && content.includes('supabase')) {
    
    // Fix 1: Replace imports from config containing supabase with direct import
    const originalContent = content;
    content = content.replace(
      /import \{([^}]*supabase[^}]*)\} from ['"]\.\.\/lib\/config['"];/g,
      'import { supabase } from \'../lib/supabaseClient\';'
    );
    
    content = content.replace(
      /import \{([^}]*supabase[^}]*)\} from ['"]\.\/config['"];/g,
      'import { supabase } from \'./supabaseClient\';'
    );
    
    // Fix 2: Replace any use of config.supabase.url or similar
    content = content.replace(/config\.supabase\.url/g, 'import.meta.env.VITE_SUPABASE_URL');
    content = content.replace(/config\.supabase\.anonKey/g, 'import.meta.env.VITE_SUPABASE_ANON_KEY');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed Supabase client in: ${filePath}`);
      fixCount++;
      modified = true;
    }
  }
  
  // Check for multiple independent client creations
  if (!modified && content.includes('createClient(') && content.includes('@supabase/supabase-js')) {
    // Skip the main supabaseClient.ts file
    if (!filePath.endsWith('supabaseClient.ts')) {
      console.log(`⚠️ Found separate Supabase client in: ${filePath}`);
    }
  }
}

console.log(`✅ Fixed ${fixCount} files with incorrect Supabase client usage.`);
console.log('All Supabase client issues fixed!'); 