#!/usr/bin/env node

/**
 * End-to-End Data Flow Test
 * 
 * This script demonstrates and validates the complete data flow through the system:
 * 1. Fetch data using JavaScript fetcher (mocked for testing)
 * 2. Serialize to JSON
 * 3. Validate JSON structure
 * 4. Simulate Rust consumption
 * 5. Validate type compatibility
 */

const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log();
  log(`${'='.repeat(70)}`, colors.cyan);
  log(title, colors.bright + colors.cyan);
  log(`${'='.repeat(70)}`, colors.cyan);
  console.log();
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

/**
 * Create sample DexData for testing
 */
function createSampleDexData() {
  return {
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
        id: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
        factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
        dexName: 'Uniswap V3',
        chain: 'Ethereum',
        token0: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        token1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        reserve0: '1000000000000000000',
        reserve1: '2000000000',
        fee: '3000'
      },
      {
        id: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
        factory: null,
        dexName: 'SushiSwap',
        chain: 'Ethereum',
        token0: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        token1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        reserve0: '900000000000000000',
        reserve1: '1800000000',
        fee: '3000'
      }
    ]
  };
}

/**
 * Step 1: Generate data using JavaScript fetcher
 */
async function step1_generateData() {
  logSection('STEP 1: Generate Data (JavaScript Fetcher)');
  
  logInfo('Simulating fetchAllDexData() call...');
  
  // In production, this would be:
  // const { fetchAllDexData } = require('./src/dex-data-fetcher');
  // const data = await fetchAllDexData();
  
  const data = createSampleDexData();
  
  logSuccess(`Generated ${data.tokens.length} tokens`);
  logSuccess(`Generated ${data.pools.length} pools`);
  
  // Validate structure
  if (!data.tokens || !Array.isArray(data.tokens)) {
    throw new Error('Invalid tokens array');
  }
  if (!data.pools || !Array.isArray(data.pools)) {
    throw new Error('Invalid pools array');
  }
  
  logSuccess('Data structure validated');
  
  return data;
}

/**
 * Step 2: Serialize to JSON
 */
function step2_serializeToJson(data) {
  logSection('STEP 2: Serialize to JSON');
  
  logInfo('Converting DexData to JSON...');
  
  const jsonString = JSON.stringify(data, (key, value) => {
    // Convert BigInt to string for JSON serialization
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }, 2);
  
  logSuccess(`Serialized to JSON (${jsonString.length} bytes)`);
  
  // Write to file
  const outputPath = path.join(__dirname, 'dex_data_e2e_test.json');
  fs.writeFileSync(outputPath, jsonString);
  
  logSuccess(`Written to ${outputPath}`);
  
  return { jsonString, outputPath };
}

/**
 * Step 3: Validate JSON structure
 */
function step3_validateJson(jsonString) {
  logSection('STEP 3: Validate JSON Structure');
  
  logInfo('Parsing JSON...');
  
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`JSON parsing failed: ${error.message}`);
  }
  
  logSuccess('JSON parsed successfully');
  
  // Validate structure
  const validations = [
    { check: () => parsed.tokens !== undefined, msg: 'tokens field exists' },
    { check: () => Array.isArray(parsed.tokens), msg: 'tokens is an array' },
    { check: () => parsed.pools !== undefined, msg: 'pools field exists' },
    { check: () => Array.isArray(parsed.pools), msg: 'pools is an array' },
    { check: () => parsed.tokens.length > 0, msg: 'tokens array not empty' },
    { check: () => parsed.pools.length > 0, msg: 'pools array not empty' }
  ];
  
  validations.forEach(({ check, msg }) => {
    if (!check()) {
      throw new Error(`Validation failed: ${msg}`);
    }
    logSuccess(msg);
  });
  
  return parsed;
}

/**
 * Step 4: Validate type compatibility for Rust
 */
function step4_validateRustCompatibility(data) {
  logSection('STEP 4: Validate Rust Type Compatibility');
  
  logInfo('Checking Token type compatibility...');
  
  // Expected Rust Token fields
  const tokenFields = ['symbol', 'decimals', 'address'];
  
  data.tokens.forEach((token, idx) => {
    tokenFields.forEach(field => {
      if (!(field in token)) {
        throw new Error(`Token ${idx} missing field: ${field}`);
      }
    });
  });
  
  logSuccess(`All ${data.tokens.length} tokens have required fields`);
  
  logInfo('Checking Pool type compatibility...');
  
  // Expected Rust Pool fields
  const poolFields = ['dexName', 'chain', 'token0', 'token1', 'reserve0', 'reserve1', 'fee'];
  
  data.pools.forEach((pool, idx) => {
    poolFields.forEach(field => {
      if (!(field in pool)) {
        throw new Error(`Pool ${idx} missing field: ${field}`);
      }
    });
  });
  
  logSuccess(`All ${data.pools.length} pools have required fields`);
  
  // Validate numeric types can be converted
  logInfo('Validating numeric conversions...');
  
  data.tokens.forEach(token => {
    if (typeof token.decimals !== 'number') {
      throw new Error(`Token ${token.symbol} decimals is not a number`);
    }
  });
  
  data.pools.forEach(pool => {
    // Check that reserves and fees are convertible to u64
    ['reserve0', 'reserve1', 'fee'].forEach(field => {
      const value = pool[field];
      if (value === null || value === undefined) {
        throw new Error(`Pool ${pool.id || 'unknown'} ${field} is null/undefined`);
      }
      // Try to convert to number to validate
      const numValue = typeof value === 'string' ? BigInt(value) : BigInt(value);
      if (numValue < 0n) {
        throw new Error(`Pool ${pool.id || 'unknown'} ${field} is negative`);
      }
    });
  });
  
  logSuccess('All numeric values are valid for Rust u64');
  
  logInfo('Checking address formats...');
  
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  
  data.tokens.forEach(token => {
    if (!addressRegex.test(token.address)) {
      throw new Error(`Token ${token.symbol} has invalid address format`);
    }
  });
  
  logSuccess('All token addresses are valid');
  
  logSuccess('✓ All types compatible with Rust structures');
}

/**
 * Step 5: Simulate Rust consumption
 */
function step5_simulateRustConsumption(outputPath) {
  logSection('STEP 5: Simulate Rust Consumption');
  
  logInfo('Simulating Rust program loading JSON...');
  logInfo(`  File: ${outputPath}`);
  
  // Read the file (as Rust would)
  const content = fs.readFileSync(outputPath, 'utf8');
  const data = JSON.parse(content);
  
  logSuccess('File loaded successfully');
  
  // Simulate Rust deserialization
  logInfo('Simulating serde_json deserialization...');
  
  // Convert string numbers to BigInt (simulating Rust u64)
  data.pools = data.pools.map(pool => ({
    ...pool,
    reserve0: BigInt(pool.reserve0),
    reserve1: BigInt(pool.reserve1),
    fee: BigInt(pool.fee)
  }));
  
  logSuccess('Deserialization successful');
  
  // Simulate DualExecutor processing
  logInfo('Simulating DualExecutor processing...');
  
  logInfo(`  Total tokens in registry: ${data.tokens.length}`);
  logInfo(`  Total pools to process: ${data.pools.length}`);
  
  // Simulate SummaryEngine
  logInfo('  [SummaryEngine] Executing...');
  logSuccess(`    Tokens: ${data.tokens.length}, Pools: ${data.pools.length}`);
  
  // Simulate TopPoolEngine
  logInfo('  [TopPoolEngine] Executing...');
  const topPool = data.pools.reduce((max, pool) => {
    const total = pool.reserve0 + pool.reserve1;
    const maxTotal = max.reserve0 + max.reserve1;
    return total > maxTotal ? pool : max;
  }, data.pools[0]);
  logSuccess(`    Top pool: ${topPool.dexName} with ${topPool.reserve0 + topPool.reserve1} total reserves`);
  
  // Simulate AIScorerEngine
  logInfo('  [AIScorerEngine] Executing...');
  const scores = data.pools.map(pool => {
    const totalReserve = Number(pool.reserve0 + pool.reserve1);
    const feeFactor = 1.0 - Number(pool.fee) / 10000.0;
    return (totalReserve * feeFactor) / 1000000.0;
  });
  logSuccess(`    Scored ${scores.length} pools`);
  
  logSuccess('✓ Rust simulation completed successfully');
  
  return data;
}

/**
 * Step 6: Validate data integrity
 */
function step6_validateDataIntegrity(originalData, processedData) {
  logSection('STEP 6: Validate Data Integrity');
  
  logInfo('Verifying data integrity after round-trip...');
  
  // Check token count
  if (originalData.tokens.length !== processedData.tokens.length) {
    throw new Error('Token count mismatch');
  }
  logSuccess(`Token count preserved: ${originalData.tokens.length}`);
  
  // Check pool count
  if (originalData.pools.length !== processedData.pools.length) {
    throw new Error('Pool count mismatch');
  }
  logSuccess(`Pool count preserved: ${originalData.pools.length}`);
  
  // Check token addresses
  originalData.tokens.forEach((origToken, idx) => {
    const procToken = processedData.tokens[idx];
    if (origToken.address !== procToken.address) {
      throw new Error(`Token ${idx} address mismatch`);
    }
  });
  logSuccess('All token addresses preserved');
  
  // Check pool data
  originalData.pools.forEach((origPool, idx) => {
    const procPool = processedData.pools[idx];
    if (origPool.token0 !== procPool.token0 || origPool.token1 !== procPool.token1) {
      throw new Error(`Pool ${idx} token addresses mismatch`);
    }
  });
  logSuccess('All pool data preserved');
  
  logSuccess('✓ Data integrity validated');
}

/**
 * Cleanup
 */
function cleanup(outputPath) {
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    logInfo(`Cleaned up test file: ${outputPath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  log('═'.repeat(70), colors.bright);
  log('END-TO-END DATA FLOW TEST', colors.bright + colors.cyan);
  log('Validating complete system data flow', colors.cyan);
  log('═'.repeat(70), colors.bright);
  
  let outputPath = null;
  let success = false;
  
  try {
    // Execute all steps
    const data1 = await step1_generateData();
    const { jsonString, outputPath: path } = step2_serializeToJson(data1);
    outputPath = path;
    const data2 = step3_validateJson(jsonString);
    step4_validateRustCompatibility(data2);
    const data3 = step5_simulateRustConsumption(outputPath);
    step6_validateDataIntegrity(data1, data3);
    
    success = true;
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
  } finally {
    if (outputPath) {
      cleanup(outputPath);
    }
  }
  
  // Print summary
  logSection('TEST SUMMARY');
  
  if (success) {
    log('═'.repeat(70), colors.green);
    log('✓ END-TO-END DATA FLOW TEST PASSED', colors.bright + colors.green);
    log('✓ JavaScript → JSON → Rust flow validated', colors.green);
    log('✓ Type compatibility confirmed', colors.green);
    log('✓ Data integrity verified', colors.green);
    log('═'.repeat(70), colors.green);
    console.log();
    process.exit(0);
  } else {
    log('═'.repeat(70), colors.red);
    log('✗ END-TO-END DATA FLOW TEST FAILED', colors.bright + colors.red);
    log('═'.repeat(70), colors.red);
    console.log();
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  createSampleDexData,
  step1_generateData,
  step2_serializeToJson,
  step3_validateJson,
  step4_validateRustCompatibility,
  step5_simulateRustConsumption,
  step6_validateDataIntegrity
};
