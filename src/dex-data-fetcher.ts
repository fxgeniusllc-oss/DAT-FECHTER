import { GraphQLClient } from 'graphql-request';

/**
 * Token interface representing a cryptocurrency token
 */
export interface Token {
  symbol: string;
  decimals: number;
  address: string;
}

/**
 * Pool interface representing a liquidity pool
 */
export interface Pool {
  dexName: string;
  chain: string;
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  fee: bigint;
}

/**
 * Configuration interface for DEX data fetcher
 */
export interface DexConfig {
  ethereumRpcUrl: string;
  polygonRpcUrl: string;
  graphApiKey?: string;
}

/**
 * Result interface for fetched DEX data
 */
export interface DexData {
  tokens: Token[];
  pools: Pool[];
}

/**
 * Fetch Uniswap V3 data from The Graph
 */
async function fetchUniswapV3Data(config: DexConfig): Promise<{ tokens: Token[]; pools: Pool[] }> {
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
    const data: any = await client.request(query);
    const pools: Pool[] = [];
    const tokenMap = new Map<string, Token>();

    data.pools?.forEach((pool: any) => {
      // Add tokens to registry
      if (!tokenMap.has(pool.token0.id)) {
        const token: Token = {
          symbol: pool.token0.symbol,
          decimals: parseInt(pool.token0.decimals),
          address: pool.token0.id.toLowerCase()
        };
        tokenMap.set(pool.token0.id, token);
      }

      if (!tokenMap.has(pool.token1.id)) {
        const token: Token = {
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
 */
async function fetchSushiSwapData(config: DexConfig): Promise<{ tokens: Token[]; pools: Pool[] }> {
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
    const data: any = await client.request(query);
    const tokens: Token[] = [];
    const pools: Pool[] = [];
    const tokenMap = new Map<string, Token>();

    data.pairs?.forEach((pair: any) => {
      // Add tokens to registry
      if (!tokenMap.has(pair.token0.id)) {
        const token: Token = {
          symbol: pair.token0.symbol,
          decimals: parseInt(pair.token0.decimals),
          address: pair.token0.id.toLowerCase()
        };
        tokenMap.set(pair.token0.id, token);
      }

      if (!tokenMap.has(pair.token1.id)) {
        const token: Token = {
          symbol: pair.token1.symbol,
          decimals: parseInt(pair.token1.decimals),
          address: pair.token1.id.toLowerCase()
        };
        tokenMap.set(pair.token1.id, token);
      }

      // Add pool
      pools.push({
        dexName: 'SushiSwap',
        chain: 'Ethereum',
        token0: pair.token0.id.toLowerCase(),
        token1: pair.token1.id.toLowerCase(),
        reserve0: BigInt(Math.floor(parseFloat(pair.reserve0 || 0) * 1e18)),
        reserve1: BigInt(Math.floor(parseFloat(pair.reserve1 || 0) * 1e18)),
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
 */
async function fetchQuickSwapData(config: DexConfig): Promise<{ tokens: Token[]; pools: Pool[] }> {
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
    const data: any = await client.request(query);
    const pools: Pool[] = [];
    const tokenMap = new Map<string, Token>();

    data.pairs?.forEach((pair: any) => {
      // Add tokens to registry
      if (!tokenMap.has(pair.token0.id)) {
        const token: Token = {
          symbol: pair.token0.symbol,
          decimals: parseInt(pair.token0.decimals),
          address: pair.token0.id.toLowerCase()
        };
        tokenMap.set(pair.token0.id, token);
      }

      if (!tokenMap.has(pair.token1.id)) {
        const token: Token = {
          symbol: pair.token1.symbol,
          decimals: parseInt(pair.token1.decimals),
          address: pair.token1.id.toLowerCase()
        };
        tokenMap.set(pair.token1.id, token);
      }

      // Add pool
      pools.push({
        dexName: 'QuickSwap',
        chain: 'Polygon',
        token0: pair.token0.id.toLowerCase(),
        token1: pair.token1.id.toLowerCase(),
        reserve0: BigInt(Math.floor(parseFloat(pair.reserve0 || 0) * 1e18)),
        reserve1: BigInt(Math.floor(parseFloat(pair.reserve1 || 0) * 1e18)),
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
 */
function mergeTokens(tokenArrays: Token[][]): Token[] {
  const tokenMap = new Map<string, Token>();
  
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
 * @param config Configuration object with RPC URLs and API keys
 * @returns Promise resolving to DexData with tokens and pools
 */
export async function fetchAllDexData(config?: DexConfig): Promise<DexData> {
  // Build config with proper fallback logic - only use env vars if config values are empty/undefined
  const ethereumRpcUrl = (config?.ethereumRpcUrl && config.ethereumRpcUrl.trim() !== '') 
    ? config.ethereumRpcUrl 
    : (process.env.ETHEREUM_RPC_URL || '');
  
  const polygonRpcUrl = (config?.polygonRpcUrl && config.polygonRpcUrl.trim() !== '') 
    ? config.polygonRpcUrl 
    : (process.env.POLYGON_RPC_URL || '');
  
  const graphApiKey = config?.graphApiKey || process.env.GRAPH_API_KEY;

  const finalConfig: DexConfig = {
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
 */
export function getConfigFromEnv(): DexConfig {
  return {
    ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || '',
    polygonRpcUrl: process.env.POLYGON_RPC_URL || '',
    graphApiKey: process.env.GRAPH_API_KEY
  };
}
