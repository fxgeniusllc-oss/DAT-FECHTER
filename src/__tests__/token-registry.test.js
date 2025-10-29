const {
  MONITORED_TOKENS,
  getMonitoredTokensMap,
  isMonitoredToken,
  getTokenInfo
} = require('../token-registry');

describe('Token Registry', () => {
  describe('MONITORED_TOKENS', () => {
    test('should contain key tokens for Polygon network', () => {
      expect(MONITORED_TOKENS).toBeDefined();
      expect(Array.isArray(MONITORED_TOKENS)).toBe(true);
      expect(MONITORED_TOKENS.length).toBeGreaterThan(0);
    });

    test('should have tokens with required properties', () => {
      MONITORED_TOKENS.forEach(token => {
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('address');
        expect(typeof token.symbol).toBe('string');
        expect(typeof token.address).toBe('string');
        expect(token.symbol.length).toBeGreaterThan(0);
        expect(token.address.length).toBe(42); // Ethereum address length
        expect(token.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });

    test('should contain expected tokens (WMATIC, USDC, WETH, etc.)', () => {
      const symbols = MONITORED_TOKENS.map(token => token.symbol);
      expect(symbols).toContain('WMATIC');
      expect(symbols).toContain('USDC');
      expect(symbols).toContain('WETH');
      expect(symbols).toContain('USDT');
      expect(symbols).toContain('DAI');
      expect(symbols).toContain('WBTC');
    });

    test('should have unique token addresses', () => {
      const addresses = MONITORED_TOKENS.map(token => token.address.toLowerCase());
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(addresses.length);
    });

    test('should have unique token symbols', () => {
      const symbols = MONITORED_TOKENS.map(token => token.symbol);
      const uniqueSymbols = new Set(symbols);
      expect(uniqueSymbols.size).toBe(symbols.length);
    });
  });

  describe('getMonitoredTokensMap()', () => {
    test('should return a Map object', () => {
      const map = getMonitoredTokensMap();
      expect(map).toBeDefined();
      expect(map instanceof Map).toBe(true);
    });

    test('should contain all monitored tokens', () => {
      const map = getMonitoredTokensMap();
      expect(map.size).toBe(MONITORED_TOKENS.length);
    });

    test('should use lowercase addresses as keys', () => {
      const map = getMonitoredTokensMap();
      
      for (const [address, token] of map) {
        expect(address).toBe(address.toLowerCase());
        expect(address).toBe(token.address.toLowerCase());
      }
    });

    test('should map addresses to token info', () => {
      const map = getMonitoredTokensMap();
      const wmaticAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase();
      
      const token = map.get(wmaticAddress);
      expect(token).toBeDefined();
      expect(token.symbol).toBe('WMATIC');
      expect(token.address).toBe('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270');
    });

    test('should return the same cached map instance', () => {
      const map1 = getMonitoredTokensMap();
      const map2 = getMonitoredTokensMap();
      expect(map1).toBe(map2);
    });
  });

  describe('isMonitoredToken()', () => {
    test('should return true for monitored token addresses', () => {
      const wmaticAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
      expect(isMonitoredToken(wmaticAddress)).toBe(true);
      
      const usdcAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
      expect(isMonitoredToken(usdcAddress)).toBe(true);
    });

    test('should return false for non-monitored addresses', () => {
      const randomAddress = '0x0000000000000000000000000000000000000001';
      expect(isMonitoredToken(randomAddress)).toBe(false);
    });

    test('should be case-insensitive', () => {
      const wmaticUpper = '0x0D500B1D8E8EF31E21C99D1DB9A6444D3ADF1270';
      const wmaticLower = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';
      const wmaticMixed = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
      
      expect(isMonitoredToken(wmaticUpper)).toBe(true);
      expect(isMonitoredToken(wmaticLower)).toBe(true);
      expect(isMonitoredToken(wmaticMixed)).toBe(true);
    });

    test('should work with all monitored tokens', () => {
      MONITORED_TOKENS.forEach(token => {
        expect(isMonitoredToken(token.address)).toBe(true);
      });
    });
  });

  describe('getTokenInfo()', () => {
    test('should return token info for monitored addresses', () => {
      const wmaticAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
      const tokenInfo = getTokenInfo(wmaticAddress);
      
      expect(tokenInfo).toBeDefined();
      expect(tokenInfo.symbol).toBe('WMATIC');
      expect(tokenInfo.address).toBe(wmaticAddress);
    });

    test('should return undefined for non-monitored addresses', () => {
      const randomAddress = '0x0000000000000000000000000000000000000001';
      const tokenInfo = getTokenInfo(randomAddress);
      
      expect(tokenInfo).toBeUndefined();
    });

    test('should be case-insensitive', () => {
      const usdcUpper = '0x2791BCA1F2DE4661ED88A30C99A7A9449AA84174';
      const usdcLower = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';
      const usdcMixed = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
      
      const info1 = getTokenInfo(usdcUpper);
      const info2 = getTokenInfo(usdcLower);
      const info3 = getTokenInfo(usdcMixed);
      
      expect(info1).toBeDefined();
      expect(info2).toBeDefined();
      expect(info3).toBeDefined();
      expect(info1.symbol).toBe('USDC');
      expect(info2.symbol).toBe('USDC');
      expect(info3.symbol).toBe('USDC');
    });

    test('should return correct info for all monitored tokens', () => {
      MONITORED_TOKENS.forEach(expectedToken => {
        const tokenInfo = getTokenInfo(expectedToken.address);
        
        expect(tokenInfo).toBeDefined();
        expect(tokenInfo.symbol).toBe(expectedToken.symbol);
        expect(tokenInfo.address).toBe(expectedToken.address);
      });
    });

    test('should return the original token object structure', () => {
      const wmaticAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
      const tokenInfo = getTokenInfo(wmaticAddress);
      
      expect(Object.keys(tokenInfo)).toEqual(['symbol', 'address']);
    });
  });

  describe('Performance - Cached Map Usage', () => {
    test('isMonitoredToken should use cached map (O(1) lookup)', () => {
      // This test verifies performance by checking many lookups complete quickly
      const startTime = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        isMonitoredToken('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270');
        isMonitoredToken('0x0000000000000000000000000000000000000001');
      }
      
      const duration = Date.now() - startTime;
      // 20000 lookups should complete in well under 100ms with O(1) map lookups
      expect(duration).toBeLessThan(100);
    });

    test('getTokenInfo should use cached map (O(1) lookup)', () => {
      // This test verifies performance by checking many lookups complete quickly
      const startTime = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        getTokenInfo('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174');
        getTokenInfo('0x0000000000000000000000000000000000000001');
      }
      
      const duration = Date.now() - startTime;
      // 20000 lookups should complete in well under 100ms with O(1) map lookups
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Integration', () => {
    test('should work together to provide complete token lookup functionality', () => {
      // Get the map
      const map = getMonitoredTokensMap();
      expect(map.size).toBeGreaterThan(0);
      
      // Check a token exists
      const wmaticAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
      expect(isMonitoredToken(wmaticAddress)).toBe(true);
      
      // Get token info
      const tokenInfo = getTokenInfo(wmaticAddress);
      expect(tokenInfo).toBeDefined();
      expect(tokenInfo.symbol).toBe('WMATIC');
      
      // Verify map contains the same info
      const mapInfo = map.get(wmaticAddress.toLowerCase());
      expect(mapInfo).toBe(tokenInfo);
    });
  });
});
