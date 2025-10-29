

# README for DEX Data Fetcher and Token Registry

## Overview

The **DEX Data Fetcher** is a TypeScript module designed to aggregate and normalize liquidity pool data from multiple decentralized exchanges (DEXes) including **Uniswap V3**, **SushiSwap**, and **QuickSwap**. This module serves as a foundational component for building arbitrage strategies by providing real-time token and pool information.

### Key Features

- **Fetches real-time liquidity pool data** from multiple DEXes.
- **Normalizes token reserves** based on their decimal values.
- **Maintains a global token registry** for easy access to token information.
- **Organizes liquidity pools** with references to token addresses for efficient arbitrage calculations.

## Installation

To use the DEX Data Fetcher module, ensure you have Node.js and npm installed. Then, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install TypeScript** (if not already installed):
   ```bash
   npm install -g typescript
   ```

## Configuration

### Environment Variables Setup

The DEX Data Fetcher requires RPC endpoints and API keys to connect to blockchain networks and fetch data from The Graph protocol. Follow these steps to configure your environment:

1. **Create a `.env` file in the project root directory**:
   ```bash
   cp .env.example .env
   ```

2. **Add your RPC URLs and API keys** to the `.env` file:
   
   The `.env` file should be placed in the **root directory** of the project (the same directory as `package.json` and `README.md`).

   ```
   /your-project-root/
   ├── .env              ← Place your .env file here
   ├── .env.example      ← Example template
   ├── .gitignore        ← Ensures .env is not committed
   ├── package.json
   └── README.md
   ```

3. **Required environment variables**:

   - `ETHEREUM_RPC_URL`: Your Ethereum mainnet RPC endpoint (required for Uniswap V3 and SushiSwap)
   - `POLYGON_RPC_URL`: Your Polygon mainnet RPC endpoint (required for QuickSwap)
   - `GRAPH_API_KEY`: (Optional) Your API key from The Graph for better rate limits

4. **Getting RPC URLs**:
   
   You can obtain RPC URLs from various providers:
   - [Alchemy](https://www.alchemy.com/) - Recommended, generous free tier
   - [Infura](https://infura.io/) - Popular choice with free tier
   - [QuickNode](https://www.quicknode.com/) - Fast and reliable
   - [Ankr](https://www.ankr.com/) - Free public endpoints (rate limited)

5. **Getting The Graph API Key**:
   
   Visit [The Graph Studio](https://thegraph.com/studio/apikeys/) to create a free API key for accessing subgraph data.

### Example `.env` File

```env
# RPC Endpoints
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# The Graph API Key (optional)
GRAPH_API_KEY=YOUR_GRAPH_API_KEY
```

> **⚠️ Security Warning**: Never commit your `.env` file to version control! The `.gitignore` file is already configured to exclude it.

## Usage

### Importing the Module

You can import the DEX Data Fetcher module in your TypeScript project as follows:

```typescript
import { fetchAllDexData } from './path/to/dex-data-fetcher';
```

### Fetching Data

To fetch the latest token and pool data, call the `fetchAllDexData` function. This function returns a promise that resolves with an object containing the tokens and pools.

```typescript
(async () => {
  try {
    const { tokens, pools } = await fetchAllDexData();
    console.log('Tokens:', tokens);
    console.log('Pools:', pools);
  } catch (error) {
    console.error('Error fetching DEX data:', error);
  }
})();
```

### Example Output

The output will consist of two main components:

- **Tokens**: An array of unique tokens with their address, symbol, and decimals.
- **Pools**: An array of liquidity pools, each containing information about the DEX name, chain, token addresses, reserves, and fees.

## Functions

### `fetchAllDexData()`

- **Returns**: A promise that resolves to an object containing:
  - `tokens`: Array of token objects.
  - `pools`: Array of pool objects.

### Token Object Structure

```typescript
{
  symbol: string;     // Token symbol (e.g., ETH)
  decimals: number;   // Number of decimals
  address: string;    // Token address (lowercase)
}
```

### Pool Object Structure

```typescript
{
  dexName: string;    // Name of the DEX (e.g., Uniswap V3)
  chain: string;      // Blockchain (e.g., Ethereum)
  token0: string;     // Address of token0 (lowercase)
  token1: string;     // Address of token1 (lowercase)
  reserve0: BigNumber; // Normalized reserve of token0
  reserve1: BigNumber; // Normalized reserve of token1
  fee: BigNumber;      // Fee tier as a BigNumber
}
```

## Testing

For comprehensive testing instructions including how to run tests with your secrets and environment variables both locally and in CI/CD, see the **[Testing Guide (TESTING.md)](TESTING.md)**.

For setting up GitHub repository secrets for automated testing in CI/CD, see the **[GitHub Secrets Setup Guide (GITHUB_SECRETS_SETUP.md)](GITHUB_SECRETS_SETUP.md)**.

### Quick Test Commands

```bash
# Run tests with environment variables from .env
npm run test:env

# Run tests with coverage
npm run test:coverage

# Run comprehensive test suite using the test runner script
./run-tests.sh
```

## Additional Usage Tips

### Filtering Pools by DEX

You can filter pools by specific DEX after fetching all data:

```typescript
const { tokens, pools } = await fetchAllDexData();

// Get only Uniswap V3 pools
const uniswapPools = pools.filter(pool => pool.dexName === 'Uniswap V3');

// Get only Polygon chain pools
const polygonPools = pools.filter(pool => pool.chain === 'Polygon');
```

### Finding Tokens by Symbol

Search for specific tokens in the registry:

```typescript
const { tokens, pools } = await fetchAllDexData();

// Find USDC token
const usdcToken = tokens.find(token => token.symbol === 'USDC');
console.log('USDC Address:', usdcToken?.address);
```

### Working with Pool Reserves

Pool reserves are returned as BigInt values. Here's how to work with them:

```typescript
const { tokens, pools } = await fetchAllDexData();

if (pools.length > 0) {
  const pool = pools[0];
  
  // Convert reserves to human-readable format
  const token0 = tokens.find(t => t.address === pool.token0);
  const token1 = tokens.find(t => t.address === pool.token1);
  
  // Calculate human-readable reserves
  const reserve0Human = Number(pool.reserve0) / Math.pow(10, token0.decimals);
  const reserve1Human = Number(pool.reserve1) / Math.pow(10, token1.decimals);
  
  console.log(`Pool ${token0.symbol}/${token1.symbol}:`);
  console.log(`  Reserve 0: ${reserve0Human} ${token0.symbol}`);
  console.log(`  Reserve 1: ${reserve1Human} ${token1.symbol}`);
  console.log(`  Fee: ${Number(pool.fee) / 10000}%`);
}
```

### Calculating Token Prices

Calculate the price of one token in terms of another using pool reserves:

```typescript
const { tokens, pools } = await fetchAllDexData();

function calculatePrice(pool, tokens) {
  const token0 = tokens.find(t => t.address === pool.token0);
  const token1 = tokens.find(t => t.address === pool.token1);
  
  // Adjust for decimals
  const reserve0Adjusted = Number(pool.reserve0) / Math.pow(10, token0.decimals);
  const reserve1Adjusted = Number(pool.reserve1) / Math.pow(10, token1.decimals);
  
  // Price of token0 in terms of token1
  const price0 = reserve1Adjusted / reserve0Adjusted;
  
  return {
    [`${token0.symbol}/${token1.symbol}`]: price0,
    [`${token1.symbol}/${token0.symbol}`]: 1 / price0
  };
}

// Example usage
const pool = pools[0];
const prices = calculatePrice(pool, tokens);
console.log('Prices:', prices);
```

### Finding Arbitrage Opportunities

Compare prices across different DEXes:

```typescript
const { tokens, pools } = await fetchAllDexData();

// Find all pools for a specific token pair
function findPoolsForPair(token0Symbol, token1Symbol) {
  const token0Addresses = tokens
    .filter(t => t.symbol === token0Symbol)
    .map(t => t.address);
  const token1Addresses = tokens
    .filter(t => t.symbol === token1Symbol)
    .map(t => t.address);
  
  return pools.filter(pool => {
    return (token0Addresses.includes(pool.token0) && token1Addresses.includes(pool.token1)) ||
           (token0Addresses.includes(pool.token1) && token1Addresses.includes(pool.token0));
  });
}

// Example: Find all ETH/USDC pools
const ethUsdcPools = findPoolsForPair('WETH', 'USDC');
console.log(`Found ${ethUsdcPools.length} ETH/USDC pools across different DEXes`);
```

### Error Handling Best Practices

Always wrap API calls in try-catch blocks:

```typescript
try {
  const { tokens, pools } = await fetchAllDexData();
  
  if (pools.length === 0) {
    console.warn('No pools fetched. Check your network connection and RPC URLs.');
  }
  
  // Process data
} catch (error) {
  if (error.message.includes('RPC_URL is required')) {
    console.error('Configuration error:', error.message);
    console.log('Please check your .env file and ensure all required URLs are set.');
  } else {
    console.error('Failed to fetch DEX data:', error);
  }
}
```

### Using with TypeScript

For TypeScript projects, import types for better IDE support:

```typescript
import { fetchAllDexData, Token, Pool, DexData } from './dex-data-fetcher';

async function analyzeMarkets(): Promise<void> {
  const data: DexData = await fetchAllDexData();
  
  data.pools.forEach((pool: Pool) => {
    // TypeScript provides autocomplete and type checking
    console.log(`${pool.dexName} on ${pool.chain}`);
  });
}
```

### Custom Configuration

Override environment variables programmatically:

```typescript
const customConfig = {
  ethereumRpcUrl: 'https://your-custom-ethereum-rpc.com',
  polygonRpcUrl: 'https://your-custom-polygon-rpc.com',
  graphApiKey: 'your-custom-api-key'
};

const { tokens, pools } = await fetchAllDexData(customConfig);
```

## Contributing

Contributions are welcome! If you have any suggestions or improvements, please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Additional Resources

- [Testing Guide](TESTING.md) - Comprehensive testing documentation
- [GitHub Secrets Setup](GITHUB_SECRETS_SETUP.md) - Configure secrets for CI/CD
- [Uniswap V3 Subgraph](https://thegraph.com/explorer/subgraph/uniswap/uniswap-v3)
- [SushiSwap Subgraph](https://thegraph.com/explorer/subgraph/sushiswap/exchange)
- [QuickSwap Subgraph](https://thegraph.com/explorer/subgraph/sameepsi/quickswap06)

---

This README provides a comprehensive guide to using the DEX data fetcher module, ensuring users can easily understand its purpose and functionality. If you need further modifications or additional sections, let me know!
