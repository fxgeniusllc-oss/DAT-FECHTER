

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

## Contributing

Contributions are welcome! If you have any suggestions or improvements, please feel free to submit a pull request or open an issue.

## Additional Resources

- [Uniswap V3 Subgraph](https://thegraph.com/explorer/subgraph/uniswap/uniswap-v3)
- [SushiSwap Subgraph](https://thegraph.com/explorer/subgraph/sushiswap/exchange)
- [QuickSwap Subgraph](https://thegraph.com/explorer/subgraph/sameepsi/quickswap06)

---

This README provides a comprehensive guide to using the DEX data fetcher module, ensuring users can easily understand its purpose and functionality. If you need further modifications or additional sections, let me know!
