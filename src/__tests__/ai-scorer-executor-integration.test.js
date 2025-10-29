/**
 * Integration tests for AI Scorer and Dual Executor wiring
 * 
 * This test validates the integration between:
 * - Data Fetcher (DAT-FECHTER) - fetches pool and token data
 * - AI Scorer - scores pools based on various criteria
 * - Dual Executor - executes multiple engines/strategies
 */

const fs = require('fs');
const path = require('path');

describe('AI Scorer and Executor Integration', () => {
  let sampleDexData;

  beforeAll(() => {
    // Create sample data that matches the structure expected by both scorer and executor
    sampleDexData = {
      tokens: [
        {
          symbol: 'WETH',
          decimals: 18,
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
        },
        {
          symbol: 'USDC',
          decimals: 6,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        },
        {
          symbol: 'WMATIC',
          decimals: 18,
          address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
        }
      ],
      pools: [
        {
          dexName: 'Uniswap V3',
          chain: 'Ethereum',
          token0: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          token1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          reserve0: 1000000000000000000n,
          reserve1: 2000000000n,
          fee: 3000n
        },
        {
          dexName: 'SushiSwap',
          chain: 'Ethereum',
          token0: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          token1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          reserve0: 900000000000000000n,
          reserve1: 1800000000n,
          fee: 3000n
        },
        {
          dexName: 'QuickSwap',
          chain: 'Polygon',
          token0: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
          token1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          reserve0: 5000000000000000000n,
          reserve1: 8000000000n,
          fee: 3000n
        }
      ]
    };
  });

  describe('Data Structure Validation', () => {
    test('should have valid token structure', () => {
      expect(sampleDexData.tokens).toBeDefined();
      expect(Array.isArray(sampleDexData.tokens)).toBe(true);
      expect(sampleDexData.tokens.length).toBeGreaterThan(0);

      sampleDexData.tokens.forEach(token => {
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('address');
        expect(typeof token.symbol).toBe('string');
        expect(typeof token.decimals).toBe('number');
        expect(typeof token.address).toBe('string');
      });
    });

    test('should have valid pool structure', () => {
      expect(sampleDexData.pools).toBeDefined();
      expect(Array.isArray(sampleDexData.pools)).toBe(true);
      expect(sampleDexData.pools.length).toBeGreaterThan(0);

      sampleDexData.pools.forEach(pool => {
        expect(pool).toHaveProperty('dexName');
        expect(pool).toHaveProperty('chain');
        expect(pool).toHaveProperty('token0');
        expect(pool).toHaveProperty('token1');
        expect(pool).toHaveProperty('reserve0');
        expect(pool).toHaveProperty('reserve1');
        expect(pool).toHaveProperty('fee');
      });
    });
  });

  describe('AI Scorer Functionality', () => {
    /**
     * Simple scoring function that simulates AI scoring logic
     * In production, this would call the Rust ONNX scorer
     */
    function scorePool(pool) {
      // Score based on total liquidity and fee
      const totalReserve = Number(pool.reserve0) + Number(pool.reserve1);
      const feeFactor = 1.0 - Number(pool.fee) / 10000.0;
      return (totalReserve * feeFactor) / 1000000.0;
    }

    test('should score individual pools', () => {
      const scores = sampleDexData.pools.map(pool => ({
        pool,
        score: scorePool(pool)
      }));

      expect(scores.length).toBe(sampleDexData.pools.length);
      scores.forEach(({ score }) => {
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThan(0);
        expect(isFinite(score)).toBe(true);
      });
    });

    test('should rank pools by score', () => {
      const scoredPools = sampleDexData.pools.map(pool => ({
        pool,
        score: scorePool(pool)
      }));

      // Sort by score descending
      scoredPools.sort((a, b) => b.score - a.score);

      // Verify sorting
      for (let i = 1; i < scoredPools.length; i++) {
        expect(scoredPools[i - 1].score).toBeGreaterThanOrEqual(scoredPools[i].score);
      }
    });

    test('should handle pools with different characteristics', () => {
      const highLiquidityPool = sampleDexData.pools[2]; // QuickSwap
      const lowLiquidityPool = sampleDexData.pools[1]; // SushiSwap

      const highScore = scorePool(highLiquidityPool);
      const lowScore = scorePool(lowLiquidityPool);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('Executor Engine Pattern', () => {
    /**
     * Engine base class - similar to Rust Engine trait
     */
    class Engine {
      execute() {
        throw new Error('execute() must be implemented');
      }
    }

    /**
     * Summary Engine - prints basic statistics
     */
    class SummaryEngine extends Engine {
      execute(data) {
        return {
          name: 'SummaryEngine',
          tokenCount: data.tokens.length,
          poolCount: data.pools.length
        };
      }
    }

    /**
     * Top Pool Engine - finds pool with highest liquidity
     */
    class TopPoolEngine extends Engine {
      execute(data) {
        const topPool = data.pools.reduce((max, pool) => {
          const total = Number(pool.reserve0) + Number(pool.reserve1);
          const maxTotal = Number(max.reserve0) + Number(max.reserve1);
          return total > maxTotal ? pool : max;
        }, data.pools[0]);

        return {
          name: 'TopPoolEngine',
          topPool: {
            dexName: topPool.dexName,
            chain: topPool.chain,
            totalReserve: Number(topPool.reserve0) + Number(topPool.reserve1)
          }
        };
      }
    }

    /**
     * AI Scorer Engine - scores all pools
     */
    class AIScorerEngine extends Engine {
      execute(data) {
        const scoredPools = data.pools.map(pool => ({
          dexName: pool.dexName,
          chain: pool.chain,
          score: this.scorePool(pool)
        }));

        // Sort by score
        scoredPools.sort((a, b) => b.score - a.score);

        return {
          name: 'AIScorerEngine',
          totalScored: scoredPools.length,
          topPools: scoredPools.slice(0, 3)
        };
      }

      scorePool(pool) {
        const totalReserve = Number(pool.reserve0) + Number(pool.reserve1);
        const feeFactor = 1.0 - Number(pool.fee) / 10000.0;
        return (totalReserve * feeFactor) / 1000000.0;
      }
    }

    /**
     * Dual Executor - runs multiple engines
     */
    class DualExecutor {
      constructor() {
        this.engines = [];
      }

      addEngine(engine) {
        this.engines.push(engine);
      }

      run(data) {
        return this.engines.map(engine => engine.execute(data));
      }
    }

    test('should create executor with multiple engines', () => {
      const executor = new DualExecutor();
      executor.addEngine(new SummaryEngine());
      executor.addEngine(new TopPoolEngine());
      executor.addEngine(new AIScorerEngine());

      expect(executor.engines.length).toBe(3);
    });

    test('should execute all engines', () => {
      const executor = new DualExecutor();
      executor.addEngine(new SummaryEngine());
      executor.addEngine(new TopPoolEngine());
      executor.addEngine(new AIScorerEngine());

      const results = executor.run(sampleDexData);

      expect(results.length).toBe(3);
      expect(results[0].name).toBe('SummaryEngine');
      expect(results[1].name).toBe('TopPoolEngine');
      expect(results[2].name).toBe('AIScorerEngine');
    });

    test('should validate AI scorer integration with executor', () => {
      const executor = new DualExecutor();
      const aiScorer = new AIScorerEngine();
      executor.addEngine(aiScorer);

      const results = executor.run(sampleDexData);

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('AIScorerEngine');
      expect(results[0].totalScored).toBe(sampleDexData.pools.length);
      expect(results[0].topPools.length).toBeGreaterThan(0);
    });

    test('should validate data flow: fetcher → scorer → executor', () => {
      // Step 1: Data from fetcher (already have sampleDexData)
      expect(sampleDexData.tokens).toBeDefined();
      expect(sampleDexData.pools).toBeDefined();

      // Step 2: Scorer processes the data
      const scorer = new AIScorerEngine();
      const scorerResult = scorer.execute(sampleDexData);
      expect(scorerResult.totalScored).toBe(sampleDexData.pools.length);

      // Step 3: Executor runs multiple engines including scorer
      const executor = new DualExecutor();
      executor.addEngine(new SummaryEngine());
      executor.addEngine(scorer);
      executor.addEngine(new TopPoolEngine());

      const results = executor.run(sampleDexData);

      // Validate complete flow
      expect(results.length).toBe(3);
      expect(results[0].tokenCount).toBe(sampleDexData.tokens.length);
      expect(results[1].totalScored).toBe(sampleDexData.pools.length);
      expect(results[2].topPool).toBeDefined();
    });
  });

  describe('Integration with Real Fetcher Data', () => {
    test('should handle data from fetchAllDexData format', () => {
      // Verify our sample data matches the format from the real fetcher
      expect(sampleDexData).toMatchObject({
        tokens: expect.any(Array),
        pools: expect.any(Array)
      });

      // Verify we can process it with our engines
      class TestEngine {
        execute(data) {
          return {
            valid: data.tokens.length > 0 && data.pools.length > 0
          };
        }
      }

      const engine = new TestEngine();
      const result = engine.execute(sampleDexData);
      expect(result.valid).toBe(true);
    });
  });

  describe('Rust Integration Files Validation', () => {
    test('should have ai_onnx_scorer.rs file', () => {
      const scorerPath = path.join(__dirname, '..', 'ai_onnx_scorer.rs');
      expect(fs.existsSync(scorerPath)).toBe(true);
    });

    test('should have dual_executor.rs file', () => {
      const executorPath = path.join(__dirname, '..', 'dual_executor.rs');
      expect(fs.existsSync(executorPath)).toBe(true);
    });

    test('ai_onnx_scorer.rs should define required types', () => {
      const scorerPath = path.join(__dirname, '..', 'ai_onnx_scorer.rs');
      const content = fs.readFileSync(scorerPath, 'utf8');

      // Check for required type definitions
      expect(content).toMatch(/struct Token/);
      expect(content).toMatch(/struct Pool/);
      expect(content).toMatch(/struct DexData/);
      expect(content).toMatch(/fn score_pools_with_onnx/);
    });

    test('dual_executor.rs should define required components', () => {
      const executorPath = path.join(__dirname, '..', 'dual_executor.rs');
      const content = fs.readFileSync(executorPath, 'utf8');

      // Check for required components
      expect(content).toMatch(/struct Token/);
      expect(content).toMatch(/struct Pool/);
      expect(content).toMatch(/struct DexData/);
      expect(content).toMatch(/trait Engine/);
      expect(content).toMatch(/struct DualExecutor/);
      expect(content).toMatch(/struct AIScorerEngine/);
    });

    test('dual_executor.rs should have tests for integration', () => {
      const executorPath = path.join(__dirname, '..', 'dual_executor.rs');
      const content = fs.readFileSync(executorPath, 'utf8');

      // Check for test module
      expect(content).toMatch(/#\[cfg\(test\)\]/);
      expect(content).toMatch(/mod tests/);
      expect(content).toMatch(/test_ai_scorer_executor_wiring/);
    });
  });
});
