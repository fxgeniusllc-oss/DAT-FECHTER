const { GraphQLClient } = require('graphql-request');

/**
 * @typedef {Object} Token
 * @property {string} symbol - Token symbol (e.g., ETH)
 * @property {number} decimals - Number of decimals
 * @property {string} address - Token address (lowercase)
 */

/**
 * @typedef {Object} Pool
 * @property {string} dexName - Name of the DEX (e.g., Uniswap V3)
 * @property {string} chain - Blockchain (e.g., Ethereum)
 * @property {string} token0 - Address of token0 (lowercase)
 * @property {string} token1 - Address of token1 (lowercase)
 * @property {bigint} reserve0 - Normalized reserve of token0
 * @property {bigint} reserve1 - Normalized reserve of token1
 * @property {bigint} fee - Fee tier as a BigInt
 */

/**
 * @typedef {Object} DexConfig
 * @property {string} ethereumRpcUrl - Ethereum RPC URL
 * @property {string} polygonRpcUrl - Polygon RPC URL
 * @property {string} [graphApiKey] - Optional Graph API key
 */

/**
 * @typedef {Object} DexData
 * @property {Token[]} tokens - Array of unique tokens
 * @property {Pool[]} pools - Array of liquidity pools
 */

/**
 * Convert reserve string to BigInt safely without precision loss
 * @param {string} reserveStr - Reserve value as string
 * @param {number} decimals - Token decimals (default 18)
 * @returns {bigint} - Reserve as BigInt
 */
function parseReserveToBigInt(reserveStr, decimals = 18) {
  if (!reserveStr || reserveStr === '0') {
    return BigInt(0);
  }
  
  // Split on decimal point
  const parts = reserveStr.split('.');
  const integerPart = parts[0] || '0';
  const fractionalPart = parts[1] || '';
  
  // Pad or truncate fractional part to match decimals
  const paddedFractional = fractionalPart.padEnd(decimals, '0').substring(0, decimals);
  
  // Combine and convert to BigInt
  const combined = integerPart + paddedFractional;
  return BigInt(combined);
}

/**
 * Fetch Uniswap V3 data from The Graph
 * @param {DexConfig} config - Configuration object
 * @returns {Promise<{tokens: Token[], pools: Pool[]}>}
 */
async function fetchUniswapV3Data(config) {
  const subgraphUrl = process.env.UNISWAP_V3_SUBGRAPH_URL || 
    'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
  
  const client = new GraphQLClient(subgraphUrl, {
    headers: config.graphApiKey ? { 'Authorization': `Bearer ${config.graphApiKey}` } : {}
  });

  const query = `
    {
      pools(first: 10, orderBy: totalValueLockedUSD, orderDirection: desc) {
        id
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
        liquidity
        feeTier
        token0Price
        token1Price
      }
    }
  `;

  try {
    const data = await client.request(query);
    const pools = [];
    const tokenMap = new Map();

    data.pools?.forEach((pool) => {
      // Add tokens to registry
      if (!tokenMap.has(pool.token0.id)) {
        const token = {
          symbol: pool.token0.symbol,
          decimals: parseInt(pool.token0.decimals),
          address: pool.token0.id.toLowerCase()
        };
        tokenMap.set(pool.token0.id, token);
      }

      if (!tokenMap.has(pool.token1.id)) {
        const token = {
          symbol: pool.token1.symbol,
          decimals: parseInt(pool.token1.decimals),
          address: pool.token1.id.toLowerCase()
        };
        tokenMap.set(pool.token1.id, token);
      }

      // Add pool
      pools.push({
        dexName: 'Uniswap V3',
        chain: 'Ethereum',
        token0: pool.token0.id.toLowerCase(),
        token1: pool.token1.id.toLowerCase(),
        reserve0: BigInt(pool.liquidity || 0),
        reserve1: BigInt(pool.liquidity || 0),
        fee: BigInt(pool.feeTier || 3000)
      });
    });

    return { tokens: Array.from(tokenMap.values()), pools };
  } catch (error) {
    console.error('Error fetching Uniswap V3 data:', error);
    return { tokens: [], pools: [] };
  }
}

/**
 * Fetch SushiSwap data from The Graph
 * @param {DexConfig} config - Configuration object
 * @returns {Promise<{tokens: Token[], pools: Pool[]}>}
 */
async function fetchSushiSwapData(config) {
  const subgraphUrl = process.env.SUSHISWAP_SUBGRAPH_URL || 
    'https://api.thegraph.com/subgraphs/name/sushiswap/exchange';
  
  const client = new GraphQLClient(subgraphUrl, {
    headers: config.graphApiKey ? { 'Authorization': `Bearer ${config.graphApiKey}` } : {}
  });

  const query = `
    {
      pairs(first: 10, orderBy: reserveUSD, orderDirection: desc) {
        id
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
        reserve0
        reserve1
      }
    }
  `;

  try {
    const data = await client.request(query);
    const pools = [];
    const tokenMap = new Map();

    data.pairs?.forEach((pair) => {
      // Add tokens to registry
      if (!tokenMap.has(pair.token0.id)) {
        const token = {
          symbol: pair.token0.symbol,
          decimals: parseInt(pair.token0.decimals),
          address: pair.token0.id.toLowerCase()
        };
        tokenMap.set(pair.token0.id, token);
      }

      if (!tokenMap.has(pair.token1.id)) {
        const token = {
          symbol: pair.token1.symbol,
          decimals: parseInt(pair.token1.decimals),
          address: pair.token1.id.toLowerCase()
        };
        tokenMap.set(pair.token1.id, token);
      }

      // Add pool - use parseReserveToBigInt to avoid precision loss
      pools.push({
        dexName: 'SushiSwap',
        chain: 'Ethereum',
        token0: pair.token0.id.toLowerCase(),
        token1: pair.token1.id.toLowerCase(),
        reserve0: parseReserveToBigInt(pair.reserve0 || '0', 18),
        reserve1: parseReserveToBigInt(pair.reserve1 || '0', 18),
        fee: BigInt(3000) // SushiSwap uses 0.3% fee
      });
    });

    return { tokens: Array.from(tokenMap.values()), pools };
  } catch (error) {
    console.error('Error fetching SushiSwap data:', error);
    return { tokens: [], pools: [] };
  }
}

/**
 * Fetch QuickSwap data from The Graph
 * @param {DexConfig} config - Configuration object
 * @returns {Promise<{tokens: Token[], pools: Pool[]}>}
 */
async function fetchQuickSwapData(config) {
  const subgraphUrl = process.env.QUICKSWAP_SUBGRAPH_URL || 
    'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap06';
  
  const client = new GraphQLClient(subgraphUrl, {
    headers: config.graphApiKey ? { 'Authorization': `Bearer ${config.graphApiKey}` } : {}
  });

  const query = `
    {
      pairs(first: 10, orderBy: reserveUSD, orderDirection: desc) {
        id
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
        reserve0
        reserve1
      }
    }
  `;

  try {
    const data = await client.request(query);
    const pools = [];
    const tokenMap = new Map();

    data.pairs?.forEach((pair) => {
      // Add tokens to registry
      if (!tokenMap.has(pair.token0.id)) {
        const token = {
          symbol: pair.token0.symbol,
          decimals: parseInt(pair.token0.decimals),
          address: pair.token0.id.toLowerCase()
        };
        tokenMap.set(pair.token0.id, token);
      }

      if (!tokenMap.has(pair.token1.id)) {
        const token = {
          symbol: pair.token1.symbol,
          decimals: parseInt(pair.token1.decimals),
          address: pair.token1.id.toLowerCase()
        };
        tokenMap.set(pair.token1.id, token);
      }

      // Add pool - use parseReserveToBigInt to avoid precision loss
      pools.push({
        dexName: 'QuickSwap',
        chain: 'Polygon',
        token0: pair.token0.id.toLowerCase(),
        token1: pair.token1.id.toLowerCase(),
        reserve0: parseReserveToBigInt(pair.reserve0 || '0', 18),
        reserve1: parseReserveToBigInt(pair.reserve1 || '0', 18),
        fee: BigInt(3000) // QuickSwap uses 0.3% fee
      });
    });

    return { tokens: Array.from(tokenMap.values()), pools };
  } catch (error) {
    console.error('Error fetching QuickSwap data:', error);
    return { tokens: [], pools: [] };
  }
}

/**
 * Merge tokens from multiple sources, removing duplicates
 * @param {Token[][]} tokenArrays - Arrays of tokens to merge
 * @returns {Token[]} - Merged unique tokens
 */
function mergeTokens(tokenArrays) {
  const tokenMap = new Map();
  
  tokenArrays.forEach(tokens => {
    tokens.forEach(token => {
      if (!tokenMap.has(token.address)) {
        tokenMap.set(token.address, token);
      }
    });
  });
  
  return Array.from(tokenMap.values());
}

/**
 * Main function to fetch all DEX data
 * @param {DexConfig} [config] - Configuration object with RPC URLs and API keys
 * @returns {Promise<DexData>} - Promise resolving to DexData with tokens and pools
 */
async function fetchAllDexData(config) {
  // Build config with proper fallback logic - only use env vars if config values are empty/undefined
  const ethereumRpcUrl = (config?.ethereumRpcUrl && config.ethereumRpcUrl.trim() !== '') 
    ? config.ethereumRpcUrl 
    : (process.env.ETHEREUM_RPC_URL || '');
  
  const polygonRpcUrl = (config?.polygonRpcUrl && config.polygonRpcUrl.trim() !== '') 
    ? config.polygonRpcUrl 
    : (process.env.POLYGON_RPC_URL || '');
  
  const graphApiKey = config?.graphApiKey || process.env.GRAPH_API_KEY;

  const finalConfig = {
    ethereumRpcUrl,
    polygonRpcUrl,
    graphApiKey
  };

  // Validate configuration
  if (!finalConfig.ethereumRpcUrl || finalConfig.ethereumRpcUrl.trim() === '') {
    throw new Error('ETHEREUM_RPC_URL is required');
  }
  if (!finalConfig.polygonRpcUrl || finalConfig.polygonRpcUrl.trim() === '') {
    throw new Error('POLYGON_RPC_URL is required');
  }

  console.log('Fetching DEX data from multiple sources...');

  // Fetch data from all DEXes in parallel
  const [uniswapData, sushiswapData, quickswapData] = await Promise.all([
    fetchUniswapV3Data(finalConfig),
    fetchSushiSwapData(finalConfig),
    fetchQuickSwapData(finalConfig)
  ]);

  // Merge all tokens and pools
  const allTokens = mergeTokens([
    uniswapData.tokens,
    sushiswapData.tokens,
    quickswapData.tokens
  ]);

  const allPools = [
    ...uniswapData.pools,
    ...sushiswapData.pools,
    ...quickswapData.pools
  ];

  console.log(`Fetched ${allTokens.length} unique tokens and ${allPools.length} pools`);

  return {
    tokens: allTokens,
    pools: allPools
  };
}

/**
 * Get configuration from environment variables
 * @returns {DexConfig} - Configuration object
 */
function getConfigFromEnv() {
  return {
    ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || '',
    polygonRpcUrl: process.env.POLYGON_RPC_URL || '',
    graphApiKey: process.env.GRAPH_API_KEY
  };
}

module.exports = {
  fetchAllDexData,
  getConfigFromEnv
};
