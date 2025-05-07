# Crypto Wallet Viewer

A crypto wallet viewer application built with React, TypeScript, and Supabase. This project allows users to view their crypto wallet addresses and track their cryptocurrency holdings.

## Features

- User registration and login with email/password
- Secure authentication with Supabase
- View crypto wallet balances and transactions
- Track multiple cryptocurrency holdings
- Integration with CoinGecko API for price data
- Support for Coreum and XRP networks
- Responsive UI design for desktop and mobile
- Support for up to 100 users

## Technology Stack

- React with TypeScript for frontend
- Supabase for authentication and database
- CoinGecko API for cryptocurrency price data
- Coreum RPC API for Coreum blockchain data
- XRP API for XRP Ledger data
- Modular, component-based architecture

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Supabase account and project
- CoinGecko API key (free tier)

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd crypto-wallet-viewer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Supabase project and set up a PostgreSQL database with the following tables:

   ```sql
   -- Users' wallet addresses
   CREATE TABLE wallet_addresses (
     id SERIAL PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     blockchain VARCHAR NOT NULL,
     address TEXT NOT NULL,
     label TEXT,
     is_favorite BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE wallet_addresses ENABLE ROW LEVEL SECURITY;

   -- Create policy for users to only see their own wallet addresses
   CREATE POLICY "Users can only see their own wallet addresses" ON wallet_addresses
     FOR SELECT USING (auth.uid() = user_id);

   -- Create policy for users to insert their own wallet addresses
   CREATE POLICY "Users can insert their own wallet addresses" ON wallet_addresses
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Create policy for users to update their own wallet addresses
   CREATE POLICY "Users can update their own wallet addresses" ON wallet_addresses
     FOR UPDATE USING (auth.uid() = user_id);

   -- Create policy for users to delete their own wallet addresses
   CREATE POLICY "Users can delete their own wallet addresses" ON wallet_addresses
     FOR DELETE USING (auth.uid() = user_id);
   ```

4. Configure your Supabase and API credentials in src/lib/config.ts

5. Start the development server:
   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173`

## Project Structure

- `/src/components` - Reusable UI components
- `/src/context` - React context for state management
- `/src/lib` - Utility functions, API clients, and configuration
- `/src/pages` - Page components
- `/src/services` - Service modules for API integration
- `/src/hooks` - Custom React hooks
- `/src/types` - TypeScript type definitions
- `/src/App.tsx` - Main application component with routing

## API Integrations

### CoinGecko API
Used for retrieving current cryptocurrency prices and market data.

### Coreum RPC API
Used for fetching Coreum blockchain data and wallet information.

### XRP API
Used for accessing XRP Ledger data and account information.

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **UI Components**: Reusable UI elements
- **Pages**: Screen layouts and routing
- **Services**: API calls and data fetching logic
- **Context**: Global state management
- **Hooks**: Reusable logic for components

Components are chunked logically, with related functionality grouped together where it makes sense for performance or logical cohesion.

## Environment Variables

The application uses the following environment variables:

```
VITE_DB_HOST=your-supabase-db-host
VITE_DB_PORT=your-supabase-db-port
VITE_DB_NAME=postgres
VITE_DB_USER=postgres
VITE_DB_PASSWORD=your-password
VITE_DB_CONNECTION_STRING=your-connection-string
VITE_POOL_MODE=transaction
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_COINGECKO_API_KEY=your-coingecko-api-key
VITE_COREUM_RPC_URL=your-coreum-rpc-url
VITE_XRP_API_URL=your-xrp-api-url
```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Crypto Wallet Manager

## Blockchain API Configuration

The application can now be configured to use real blockchain data or mock data:

### Environment Variables

Create a `.env` file in your project root (or use existing one) with the following variables:

```
# API Configuration 
REACT_APP_USE_REAL_API=true    # Set to 'true' to use real blockchain APIs
REACT_APP_USE_FALLBACK_MOCKS=true  # Set to 'true' to fall back to mocks if API fails

# XRP Configuration
REACT_APP_XRP_API_URL=https://xrplcluster.com  # For mainnet
# REACT_APP_XRP_API_URL=https://s.altnet.rippletest.net:51234  # For testnet

# Coreum Configuration
REACT_APP_COREUM_RPC_URL=https://rest-coreum.ecostake.com
REACT_APP_COREUM_REST_URL=https://rest-coreum.ecostake.com
```

### Adding New Blockchains

To add support for a new blockchain:

1. Add the blockchain configuration in `src/lib/config.ts`
2. Create a new service file (e.g. `src/services/newChainService.ts`)
3. Update the wallet detection logic in `determineBlockchain` functions
4. Update the `useWalletData` hook to handle the new blockchain

### Mock vs Real Data

- In development: Uses mock data by default unless you set `REACT_APP_USE_REAL_API=true`
- In production: Uses real blockchain data by default
- If a real API call fails, it will automatically fall back to mock data if `REACT_APP_USE_FALLBACK_MOCKS=true`

---

## Original Documentation

...
