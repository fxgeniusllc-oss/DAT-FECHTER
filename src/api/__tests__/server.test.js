const request = require('supertest');
const app = require('../server');

// Mock the dex-data-fetcher module
jest.mock('../../dex-data-fetcher', () => ({
  fetchAllDexData: jest.fn()
}));

const { fetchAllDexData } = require('../../dex-data-fetcher');

describe('API Server - /v1/evm/pools endpoint', () => {
  // Sample mock data
  const mockTokens = [
    { address: '0xtoken0', symbol: 'TOKEN0', decimals: 18 },
    { address: '0xtoken1', symbol: 'TOKEN1', decimals: 18 },
    { address: '0xtoken2', symbol: 'TOKEN2', decimals: 6 }
  ];

  const mockPools = [
    {
      id: '0xpool1',
      factory: '0xfactory1',
      dexName: 'Uniswap V3',
      chain: 'Ethereum',
      token0: '0xtoken0',
      token1: '0xtoken1',
      reserve0: BigInt('1000000000000000000'),
      reserve1: BigInt('2000000000000000000'),
      fee: BigInt('3000')
    },
    {
      id: '0xpool2',
      factory: '0xfactory2',
      dexName: 'Uniswap V3',
      chain: 'Ethereum',
      token0: '0xtoken1',
      token1: '0xtoken2',
      reserve0: BigInt('5000000000000000000'),
      reserve1: BigInt('10000000'),
      fee: BigInt('500')
    },
    {
      id: '0xpool3',
      factory: null,
      dexName: 'SushiSwap',
      chain: 'Ethereum',
      token0: '0xtoken0',
      token1: '0xtoken2',
      reserve0: BigInt('3000000000000000000'),
      reserve1: BigInt('6000000'),
      fee: BigInt('3000')
    },
    {
      id: '0xpool4',
      factory: null,
      dexName: 'QuickSwap',
      chain: 'Polygon',
      token0: '0xtoken0',
      token1: '0xtoken1',
      reserve0: BigInt('7000000000000000000'),
      reserve1: BigInt('8000000000000000000'),
      fee: BigInt('3000')
    }
  ];

  beforeEach(() => {
    // Reset mock before each test
    fetchAllDexData.mockReset();
    fetchAllDexData.mockResolvedValue({
      tokens: mockTokens,
      pools: mockPools
    });
  });

  describe('GET /health', () => {
    test('should return health check status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /v1/evm/pools - Basic functionality', () => {
    test('should return pools with default pagination', async () => {
      const response = await request(app).get('/v1/evm/pools');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 4,
        hasMore: false
      });
    });

    test('should return formatted pool data', async () => {
      const response = await request(app).get('/v1/evm/pools');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(4);
      
      const pool = response.body.data[0];
      expect(pool).toHaveProperty('id');
      expect(pool).toHaveProperty('factory');
      expect(pool).toHaveProperty('token0');
      expect(pool).toHaveProperty('token1');
      expect(pool).toHaveProperty('reserve0');
      expect(pool).toHaveProperty('reserve1');
      expect(pool).toHaveProperty('fee');
      expect(pool).toHaveProperty('protocol');
      expect(pool).toHaveProperty('network');
      
      expect(pool.token0).toHaveProperty('address');
      expect(pool.token0).toHaveProperty('symbol');
      expect(pool.token0).toHaveProperty('decimals');
    });
  });

  describe('GET /v1/evm/pools - Pagination', () => {
    test('should respect limit parameter', async () => {
      const response = await request(app).get('/v1/evm/pools?limit=2');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.hasMore).toBe(true);
    });

    test('should respect page parameter', async () => {
      const response = await request(app).get('/v1/evm/pools?limit=2&page=2');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    test('should return empty array for page beyond available data', async () => {
      const response = await request(app).get('/v1/evm/pools?page=10');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    test('should enforce maximum limit of 1000', async () => {
      const response = await request(app).get('/v1/evm/pools?limit=2000');
      
      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(1000);
    });
  });

  describe('GET /v1/evm/pools - Network filtering', () => {
    test('should filter by mainnet network', async () => {
      const response = await request(app).get('/v1/evm/pools?network=mainnet');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
      response.body.data.forEach(pool => {
        expect(pool.network).toBe('Ethereum');
      });
    });

    test('should filter by polygon network', async () => {
      const response = await request(app).get('/v1/evm/pools?network=polygon');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].network).toBe('Polygon');
    });

    test('should return error for invalid network', async () => {
      const response = await request(app).get('/v1/evm/pools?network=invalid');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /v1/evm/pools - Protocol filtering', () => {
    test('should filter by uniswap_v3 protocol', async () => {
      const response = await request(app).get('/v1/evm/pools?protocol=uniswap_v3');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach(pool => {
        expect(pool.protocol).toBe('Uniswap V3');
      });
    });

    test('should return error for invalid protocol', async () => {
      const response = await request(app).get('/v1/evm/pools?protocol=invalid');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /v1/evm/pools - Token filtering', () => {
    test('should filter by input_token', async () => {
      const response = await request(app).get('/v1/evm/pools?input_token=0xtoken0');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
      response.body.data.forEach(pool => {
        expect(
          pool.token0.address === '0xtoken0' || pool.token1.address === '0xtoken0'
        ).toBe(true);
      });
    });

    test('should filter by output_token', async () => {
      const response = await request(app).get('/v1/evm/pools?output_token=0xtoken2');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach(pool => {
        expect(
          pool.token0.address === '0xtoken2' || pool.token1.address === '0xtoken2'
        ).toBe(true);
      });
    });

    test('should filter by both input and output tokens', async () => {
      const response = await request(app)
        .get('/v1/evm/pools?input_token=0xtoken0&output_token=0xtoken1');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /v1/evm/pools - Pool and Factory filtering', () => {
    test('should filter by pool address', async () => {
      const response = await request(app).get('/v1/evm/pools?pool=0xpool1');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe('0xpool1');
    });

    test('should filter by factory address', async () => {
      const response = await request(app).get('/v1/evm/pools?factory=0xfactory1');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].factory).toBe('0xfactory1');
    });

    test('should support comma-separated pool addresses', async () => {
      const response = await request(app)
        .get('/v1/evm/pools?pool=0xpool1,0xpool2');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /v1/evm/pools - Combined filters', () => {
    test('should apply multiple filters', async () => {
      const response = await request(app)
        .get('/v1/evm/pools?network=mainnet&protocol=uniswap_v3&limit=5');
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach(pool => {
        expect(pool.network).toBe('Ethereum');
        expect(pool.protocol).toBe('Uniswap V3');
      });
    });
  });

  describe('GET /v1/evm/pools - Error handling', () => {
    test('should return 400 for invalid page parameter', async () => {
      const response = await request(app).get('/v1/evm/pools?page=0');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for invalid limit parameter', async () => {
      const response = await request(app).get('/v1/evm/pools?limit=0');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle fetchAllDexData errors', async () => {
      fetchAllDexData.mockRejectedValue(new Error('Network error'));
      
      const response = await request(app).get('/v1/evm/pools');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /v1/evm/pools - Data format validation', () => {
    test('should return BigInt values as strings', async () => {
      const response = await request(app).get('/v1/evm/pools');
      
      expect(response.status).toBe(200);
      const pool = response.body.data[0];
      expect(typeof pool.reserve0).toBe('string');
      expect(typeof pool.reserve1).toBe('string');
      expect(typeof pool.fee).toBe('string');
    });

    test('should include token information', async () => {
      const response = await request(app).get('/v1/evm/pools');
      
      expect(response.status).toBe(200);
      const pool = response.body.data[0];
      expect(pool.token0.symbol).toBe('TOKEN0');
      expect(pool.token0.decimals).toBe(18);
      expect(pool.token1.symbol).toBe('TOKEN1');
      expect(pool.token1.decimals).toBe(18);
    });
  });
});
