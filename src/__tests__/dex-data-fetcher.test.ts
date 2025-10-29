import { fetchAllDexData, getConfigFromEnv, DexConfig } from '../dex-data-fetcher';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Log environment setup
console.log('Test environment setup complete');
console.log('Environment variables loaded:', {
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL ? '✓ Set' : '✗ Not set',
  POLYGON_RPC_URL: process.env.POLYGON_RPC_URL ? '✓ Set' : '✗ Not set',
  GRAPH_API_KEY: process.env.GRAPH_API_KEY ? '✓ Set' : '✗ Not set'
});

describe('DEX Data Fetcher - Comprehensive Tests', () => {
  let config: DexConfig;

  beforeAll(() => {
    // Load configuration from environment variables
    config = getConfigFromEnv();
  });

  describe('Environment Variables', () => {
    test('should load ETHEREUM_RPC_URL from environment', () => {
      expect(process.env.ETHEREUM_RPC_URL).toBeDefined();
      expect(process.env.ETHEREUM_RPC_URL).not.toBe('');
      console.log('✓ ETHEREUM_RPC_URL is configured');
    });

    test('should load POLYGON_RPC_URL from environment', () => {
      expect(process.env.POLYGON_RPC_URL).toBeDefined();
      expect(process.env.POLYGON_RPC_URL).not.toBe('');
      console.log('✓ POLYGON_RPC_URL is configured');
    });

    test('should optionally load GRAPH_API_KEY from environment', () => {
      // GRAPH_API_KEY is optional, so we just check if it's available
      if (process.env.GRAPH_API_KEY) {
        console.log('✓ GRAPH_API_KEY is configured');
      } else {
        console.log('ℹ GRAPH_API_KEY is not configured (optional)');
      }
      expect(true).toBe(true); // Always pass
    });

    test('should create config from environment variables', () => {
      expect(config).toBeDefined();
      expect(config.ethereumRpcUrl).toBe(process.env.ETHEREUM_RPC_URL);
      expect(config.polygonRpcUrl).toBe(process.env.POLYGON_RPC_URL);
      expect(config.graphApiKey).toBe(process.env.GRAPH_API_KEY);
      console.log('✓ Configuration loaded successfully');
    });
  });

  describe('Configuration Validation', () => {
    test('should throw error when ETHEREUM_RPC_URL is missing', async () => {
      // Temporarily save and clear env vars to test validation
      const originalEthRpc = process.env.ETHEREUM_RPC_URL;
      delete process.env.ETHEREUM_RPC_URL;
      
      const invalidConfig = {
        ethereumRpcUrl: '',
        polygonRpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/test'
      };

      await expect(fetchAllDexData(invalidConfig)).rejects.toThrow('ETHEREUM_RPC_URL is required');
      
      // Restore env var
      if (originalEthRpc) process.env.ETHEREUM_RPC_URL = originalEthRpc;
    });

    test('should throw error when POLYGON_RPC_URL is missing', async () => {
      // Temporarily save and clear env vars to test validation
      const originalPolygonRpc = process.env.POLYGON_RPC_URL;
      delete process.env.POLYGON_RPC_URL;
      
      const invalidConfig = {
        ethereumRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/test',
        polygonRpcUrl: ''
      };

      await expect(fetchAllDexData(invalidConfig)).rejects.toThrow('POLYGON_RPC_URL is required');
      
      // Restore env var
      if (originalPolygonRpc) process.env.POLYGON_RPC_URL = originalPolygonRpc;
    });

    test('should accept valid configuration', () => {
      expect(config.ethereumRpcUrl).toBeTruthy();
      expect(config.polygonRpcUrl).toBeTruthy();
      console.log('✓ Valid configuration accepted');
    });
  });

  describe('Data Fetching Integration Tests', () => {
    // These tests will make real API calls using the configured environment variables
    test('should fetch DEX data successfully with environment credentials', async () => {
      console.log('Fetching data from DEXes with configured credentials...');
      
      const result = await fetchAllDexData(config);
      
      expect(result).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.pools).toBeDefined();
      expect(Array.isArray(result.tokens)).toBe(true);
      expect(Array.isArray(result.pools)).toBe(true);
      
      console.log(`✓ Fetched ${result.tokens.length} tokens`);
      console.log(`✓ Fetched ${result.pools.length} pools`);
    }, 30000); // 30 second timeout for API calls

    test('should return tokens with correct structure', async () => {
      const result = await fetchAllDexData(config);
      
      if (result.tokens.length > 0) {
        const token = result.tokens[0];
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('address');
        expect(typeof token.symbol).toBe('string');
        expect(typeof token.decimals).toBe('number');
        expect(typeof token.address).toBe('string');
        expect(token.address).toBe(token.address.toLowerCase());
        console.log('✓ Token structure validated:', token);
      }
    }, 30000);

    test('should return pools with correct structure', async () => {
      const result = await fetchAllDexData(config);
      
      if (result.pools.length > 0) {
        const pool = result.pools[0];
        expect(pool).toHaveProperty('dexName');
        expect(pool).toHaveProperty('chain');
        expect(pool).toHaveProperty('token0');
        expect(pool).toHaveProperty('token1');
        expect(pool).toHaveProperty('reserve0');
        expect(pool).toHaveProperty('reserve1');
        expect(pool).toHaveProperty('fee');
        expect(typeof pool.dexName).toBe('string');
        expect(typeof pool.chain).toBe('string');
        expect(typeof pool.token0).toBe('string');
        expect(typeof pool.token1).toBe('string');
        expect(typeof pool.reserve0).toBe('bigint');
        expect(typeof pool.reserve1).toBe('bigint');
        expect(typeof pool.fee).toBe('bigint');
        console.log('✓ Pool structure validated:', {
          ...pool,
          reserve0: pool.reserve0.toString(),
          reserve1: pool.reserve1.toString(),
          fee: pool.fee.toString()
        });
      }
    }, 30000);

    test('should fetch data from multiple DEXes', async () => {
      const result = await fetchAllDexData(config);
      
      const dexNames = new Set(result.pools.map(pool => pool.dexName));
      console.log('✓ DEXes found:', Array.from(dexNames));
      
      // We expect data from at least one DEX
      expect(dexNames.size).toBeGreaterThanOrEqual(1);
    }, 30000);

    test('should have unique token addresses', async () => {
      const result = await fetchAllDexData(config);
      
      const addresses = result.tokens.map(t => t.address);
      const uniqueAddresses = new Set(addresses);
      
      expect(uniqueAddresses.size).toBe(addresses.length);
      console.log('✓ All token addresses are unique');
    }, 30000);

    test('should normalize token addresses to lowercase', async () => {
      const result = await fetchAllDexData(config);
      
      result.tokens.forEach(token => {
        expect(token.address).toBe(token.address.toLowerCase());
      });
      
      result.pools.forEach(pool => {
        expect(pool.token0).toBe(pool.token0.toLowerCase());
        expect(pool.token1).toBe(pool.token1.toLowerCase());
      });
      
      console.log('✓ All addresses are normalized to lowercase');
    }, 30000);
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Use invalid RPC URLs to simulate network errors
      const badConfig = {
        ethereumRpcUrl: 'https://invalid-rpc-url.example.com',
        polygonRpcUrl: 'https://invalid-rpc-url.example.com',
        graphApiKey: 'invalid-key'
      };

      // The function should not throw but should return empty results
      const result = await fetchAllDexData(badConfig);
      
      expect(result).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.pools).toBeDefined();
      expect(Array.isArray(result.tokens)).toBe(true);
      expect(Array.isArray(result.pools)).toBe(true);
      console.log('✓ Error handling works correctly');
    }, 30000);
  });

  describe('Performance Tests', () => {
    test('should fetch data within reasonable time', async () => {
      const startTime = Date.now();
      
      await fetchAllDexData(config);
      
      const duration = Date.now() - startTime;
      console.log(`✓ Data fetched in ${duration}ms`);
      
      // Should complete within 25 seconds
      expect(duration).toBeLessThan(25000);
    }, 30000);
  });

  describe('Data Quality Tests', () => {
    test('should have valid decimal values for tokens', async () => {
      const result = await fetchAllDexData(config);
      
      result.tokens.forEach(token => {
        expect(token.decimals).toBeGreaterThanOrEqual(0);
        expect(token.decimals).toBeLessThanOrEqual(18);
        expect(Number.isInteger(token.decimals)).toBe(true);
      });
      
      console.log('✓ All token decimals are valid');
    }, 30000);

    test('should have non-negative reserves', async () => {
      const result = await fetchAllDexData(config);
      
      result.pools.forEach(pool => {
        expect(pool.reserve0).toBeGreaterThanOrEqual(BigInt(0));
        expect(pool.reserve1).toBeGreaterThanOrEqual(BigInt(0));
      });
      
      console.log('✓ All pool reserves are non-negative');
    }, 30000);

    test('should have valid fee values', async () => {
      const result = await fetchAllDexData(config);
      
      result.pools.forEach(pool => {
        expect(pool.fee).toBeGreaterThanOrEqual(BigInt(0));
        // Typical fee range is 0-10000 (0% - 1%)
        expect(pool.fee).toBeLessThanOrEqual(BigInt(10000));
      });
      
      console.log('✓ All pool fees are valid');
    }, 30000);
  });
});
