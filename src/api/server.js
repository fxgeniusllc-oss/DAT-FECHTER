const express = require('express');
const cors = require('cors');
const { fetchAllDexData } = require('../dex-data-fetcher');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Network ID mapping to chain names
 */
const NETWORK_MAPPING = {
  'arbitrum-one': 'Arbitrum',
  'avalanche': 'Avalanche',
  'base': 'Base',
  'bsc': 'BSC',
  'mainnet': 'Ethereum',
  'optimism': 'Optimism',
  'polygon': 'Polygon',
  'unichain': 'Unichain'
};

/**
 * Protocol mapping
 */
const PROTOCOL_MAPPING = {
  'uniswap_v2': 'Uniswap V2',
  'uniswap_v3': 'Uniswap V3',
  'uniswap_v4': 'Uniswap V4'
};

/**
 * Filter pools by query parameters
 * @param {Array} pools - Array of pool objects
 * @param {Object} query - Query parameters
 * @returns {Array} - Filtered pools
 */
function filterPools(pools, query) {
  let filtered = [...pools];

  // Filter by network
  if (query.network) {
    const chainName = NETWORK_MAPPING[query.network];
    if (chainName) {
      filtered = filtered.filter(pool => pool.chain === chainName);
    }
  }

  // Filter by factory address
  if (query.factory) {
    const factories = query.factory.split(',').map(f => f.toLowerCase().trim());
    filtered = filtered.filter(pool => 
      pool.factory && factories.includes(pool.factory.toLowerCase())
    );
  }

  // Filter by pool address
  if (query.pool) {
    const poolAddresses = query.pool.split(',').map(p => p.toLowerCase().trim());
    filtered = filtered.filter(pool => 
      pool.id && poolAddresses.includes(pool.id.toLowerCase())
    );
  }

  // Filter by input token (token0 or token1)
  if (query.input_token) {
    const inputTokens = query.input_token.split(',').map(t => t.toLowerCase().trim());
    filtered = filtered.filter(pool => 
      inputTokens.includes(pool.token0.toLowerCase()) || 
      inputTokens.includes(pool.token1.toLowerCase())
    );
  }

  // Filter by output token (token0 or token1)
  if (query.output_token) {
    const outputTokens = query.output_token.split(',').map(t => t.toLowerCase().trim());
    filtered = filtered.filter(pool => 
      outputTokens.includes(pool.token0.toLowerCase()) || 
      outputTokens.includes(pool.token1.toLowerCase())
    );
  }

  // Filter by protocol
  if (query.protocol) {
    const protocolName = PROTOCOL_MAPPING[query.protocol];
    if (protocolName) {
      filtered = filtered.filter(pool => pool.dexName === protocolName);
    }
  }

  return filtered;
}

/**
 * Apply pagination to results
 * @param {Array} items - Array of items
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Array} - Paginated items
 */
function paginate(items, page, limit) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return items.slice(startIndex, endIndex);
}

/**
 * Format pool data for API response
 * @param {Object} pool - Pool object
 * @param {Object} tokens - Token map
 * @returns {Object} - Formatted pool data
 */
function formatPoolResponse(pool, tokens) {
  return {
    id: pool.id || `${pool.token0}-${pool.token1}`,
    factory: pool.factory || null,
    token0: {
      address: pool.token0,
      symbol: tokens[pool.token0]?.symbol || 'UNKNOWN',
      decimals: tokens[pool.token0]?.decimals || 18
    },
    token1: {
      address: pool.token1,
      symbol: tokens[pool.token1]?.symbol || 'UNKNOWN',
      decimals: tokens[pool.token1]?.decimals || 18
    },
    reserve0: pool.reserve0.toString(),
    reserve1: pool.reserve1.toString(),
    fee: pool.fee.toString(),
    protocol: pool.dexName,
    network: pool.chain
  };
}

/**
 * GET /v1/evm/pools
 * Returns Uniswap liquidity pool metadata including token pairs, fees, and protocol versions
 */
app.get('/v1/evm/pools', async (req, res) => {
  try {
    // Parse query parameters with defaults
    const pageParam = req.query.page ? parseInt(req.query.page) : 1;
    const limitParam = req.query.limit ? parseInt(req.query.limit) : 10;
    
    const page = pageParam || 1;
    const limit = Math.min(limitParam || 10, 1000);

    // Validate pagination parameters
    if (pageParam < 1 || isNaN(pageParam)) {
      return res.status(400).json({
        error: 'Invalid page parameter. Must be >= 1'
      });
    }

    if (limitParam < 1 || isNaN(limitParam)) {
      return res.status(400).json({
        error: 'Invalid limit parameter. Must be between 1 and 1000'
      });
    }

    // Validate network parameter
    if (req.query.network && !NETWORK_MAPPING[req.query.network]) {
      return res.status(400).json({
        error: 'Invalid network parameter. Accepted values: ' + Object.keys(NETWORK_MAPPING).join(', ')
      });
    }

    // Validate protocol parameter
    if (req.query.protocol && !PROTOCOL_MAPPING[req.query.protocol]) {
      return res.status(400).json({
        error: 'Invalid protocol parameter. Accepted values: ' + Object.keys(PROTOCOL_MAPPING).join(', ')
      });
    }

    // Fetch all DEX data
    const { tokens, pools } = await fetchAllDexData();

    // Create token map for quick lookup
    const tokenMap = {};
    tokens.forEach(token => {
      tokenMap[token.address] = token;
    });

    // Filter pools based on query parameters
    const filteredPools = filterPools(pools, req.query);

    // Apply pagination
    const paginatedPools = paginate(filteredPools, page, limit);

    // Format response
    const formattedPools = paginatedPools.map(pool => formatPoolResponse(pool, tokenMap));

    // Return response
    res.json({
      data: formattedPools,
      pagination: {
        page,
        limit,
        total: filteredPools.length,
        hasMore: (page * limit) < filteredPools.length
      }
    });

  } catch (error) {
    console.error('Error fetching pools:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

module.exports = app;
