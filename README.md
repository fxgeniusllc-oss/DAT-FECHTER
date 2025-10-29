

# README for DEX Data Fetcher and Token Registry

## Overview

The **DEX Data Fetcher** is a Node.js module designed to aggregate and normalize liquidity pool data from multiple decentralized exchanges (DEXes) including **Uniswap V3**, **SushiSwap**, and **QuickSwap**. It provides both a JavaScript module for programmatic access and a **REST API server** for easy integration with any application.

### Key Features

- **REST API Server** - Production-ready Express API with `/v1/evm/pools` endpoint
- **Fetches real-time liquidity pool data** from multiple DEXes
- **Comprehensive filtering** - Filter by network, protocol, tokens, pools, and factories
- **Pagination support** - Efficient data retrieval with configurable page sizes
- **Normalizes token reserves** based on their decimal values
- **Maintains a global token registry** for easy access to token information
- **Organizes liquidity pools** with references to token addresses for efficient arbitrage calculations

## Quick Start

### API Server

Start the REST API server to access liquidity pool data:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your RPC URLs and API keys

# 3. Start the API server
npm run start:dev
```

The API will be available at `http://localhost:3000`

**Example API Request:**
```bash
# Get all pools
curl http://localhost:3000/v1/evm/pools

# Get Uniswap V3 pools on Ethereum mainnet
curl http://localhost:3000/v1/evm/pools?network=mainnet&protocol=uniswap_v3
```

📖 **[Full API Documentation](docs/API.md)**

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

## Contributing

Contributions are welcome! If you have any suggestions or improvements, please feel free to submit a pull request or open an issue.

## Additional Resources

- [Testing Guide](TESTING.md) - Comprehensive testing documentation
- [GitHub Secrets Setup](GITHUB_SECRETS_SETUP.md) - Configure secrets for CI/CD
- [Uniswap V3 Subgraph](https://thegraph.com/explorer/subgraph/uniswap/uniswap-v3)
- [SushiSwap Subgraph](https://thegraph.com/explorer/subgraph/sushiswap/exchange)
- [QuickSwap Subgraph](https://thegraph.com/explorer/subgraph/sameepsi/quickswap06)

---

This README provides a comprehensive guide to using the DEX data fetcher module, ensuring users can easily understand its purpose and functionality. If you need further modifications or additional sections, let me know!
