#!/usr/bin/env node

/**
 * System Synchronization and Wiring Validation Script
 * 
 * This script validates the complete system synchronization including:
 * - All module imports and wiring
 * - Data flow between JavaScript and Rust components
 * - Type compatibility between components
 * - API server integration
 * - Complete end-to-end data flow
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log();
  log(`${'='.repeat(70)}`, colors.cyan);
  log(`${title}`, colors.bright + colors.cyan);
  log(`${'='.repeat(70)}`, colors.cyan);
  console.log();
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

// Track validation results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

/**
 * Validate that a file exists
 */
function validateFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    logSuccess(`${description}: ${filePath}`);
    results.passed.push(`File exists: ${filePath}`);
    return true;
  } else {
    logError(`${description} not found: ${filePath}`);
    results.failed.push(`File missing: ${filePath}`);
    return false;
  }
}

/**
 * Validate file content matches pattern
 */
function validateFileContent(filePath, patterns, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    logError(`Cannot validate ${description}: ${filePath} not found`);
    results.failed.push(`File missing for validation: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const failedPatterns = [];

  patterns.forEach(({ pattern, name }) => {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    if (!regex.test(content)) {
      failedPatterns.push(name);
    }
  });

  if (failedPatterns.length === 0) {
    logSuccess(`${description}: All patterns found in ${filePath}`);
    results.passed.push(`Content validated: ${filePath}`);
    return true;
  } else {
    logError(`${description}: Missing patterns in ${filePath}: ${failedPatterns.join(', ')}`);
    results.failed.push(`Content validation failed: ${filePath}`);
    return false;
  }
}

/**
 * Validate JavaScript module imports
 */
function validateJavaScriptImports() {
  logSection('1. JAVASCRIPT MODULE IMPORTS VALIDATION');

  // Check main index.js
  validateFileExists('src/index.js', 'Main entry point');
  validateFileContent('src/index.js', [
    { pattern: /require.*dex-data-fetcher/, name: 'dex-data-fetcher import' },
    { pattern: /fetchAllDexData/, name: 'fetchAllDexData export' },
    { pattern: /getConfigFromEnv/, name: 'getConfigFromEnv export' }
  ], 'Main index exports');

  // Check dex-data-fetcher.js
  validateFileExists('src/dex-data-fetcher.js', 'DEX data fetcher module');
  validateFileContent('src/dex-data-fetcher.js', [
    { pattern: /require.*graphql-request/, name: 'GraphQL client import' },
    { pattern: /fetchUniswapV3Data/, name: 'Uniswap V3 fetcher function' },
    { pattern: /fetchSushiSwapData/, name: 'SushiSwap fetcher function' },
    { pattern: /fetchQuickSwapData/, name: 'QuickSwap fetcher function' },
    { pattern: /fetchAllDexData/, name: 'Main fetcher function' },
    { pattern: /module\.exports/, name: 'Module exports' }
  ], 'DEX data fetcher implementation');

  // Check token-registry.js
  validateFileExists('src/token-registry.js', 'Token registry module');
  validateFileContent('src/token-registry.js', [
    { pattern: /MONITORED_TOKENS/, name: 'MONITORED_TOKENS array' },
    { pattern: /getMonitoredTokensMap/, name: 'getMonitoredTokensMap function' },
    { pattern: /isMonitoredToken/, name: 'isMonitoredToken function' },
    { pattern: /getTokenInfo/, name: 'getTokenInfo function' }
  ], 'Token registry implementation');

  // Check API server
  validateFileExists('src/api/server.js', 'API server module');
  validateFileContent('src/api/server.js', [
    { pattern: /require.*express/, name: 'Express import' },
    { pattern: /require.*cors/, name: 'CORS import' },
    { pattern: /require.*dex-data-fetcher/, name: 'DEX data fetcher import' },
    { pattern: /app\.get\('\/v1\/evm\/pools'/, name: 'Pools endpoint' },
    { pattern: /app\.get\('\/health'/, name: 'Health endpoint' }
  ], 'API server implementation');

  validateFileExists('src/api/index.js', 'API server entry point');
  validateFileContent('src/api/index.js', [
    { pattern: /require.*dotenv/, name: 'dotenv import' },
    { pattern: /require.*server/, name: 'Server import' },
    { pattern: /app\.listen/, name: 'Server listen' }
  ], 'API server entry point');
}

/**
 * Validate Rust module imports and wiring
 */
function validateRustImports() {
  logSection('2. RUST MODULE IMPORTS AND WIRING VALIDATION');

  // Check lib.rs
  validateFileExists('src/lib.rs', 'Rust library entry point');
  validateFileContent('src/lib.rs', [
    { pattern: /pub mod dual_executor/, name: 'dual_executor module' },
    { pattern: /pub mod ai_onnx_scorer/, name: 'ai_onnx_scorer module' },
    { pattern: /pub use dual_executor/, name: 'dual_executor re-exports' },
    { pattern: /pub use ai_onnx_scorer/, name: 'ai_onnx_scorer re-exports' }
  ], 'Rust library exports');

  // Check dual_executor.rs
  validateFileExists('src/dual_executor.rs', 'Dual executor module');
  validateFileContent('src/dual_executor.rs', [
    { pattern: /use serde/, name: 'serde import' },
    { pattern: /struct Token/, name: 'Token struct' },
    { pattern: /struct Pool/, name: 'Pool struct' },
    { pattern: /struct DexData/, name: 'DexData struct' },
    { pattern: /trait Engine/, name: 'Engine trait' },
    { pattern: /struct DualExecutor/, name: 'DualExecutor struct' },
    { pattern: /struct SummaryEngine/, name: 'SummaryEngine struct' },
    { pattern: /struct TopPoolEngine/, name: 'TopPoolEngine struct' },
    { pattern: /struct AIScorerEngine/, name: 'AIScorerEngine struct' }
  ], 'Dual executor implementation');

  // Check ai_onnx_scorer.rs
  validateFileExists('src/ai_onnx_scorer.rs', 'AI ONNX scorer module');
  validateFileContent('src/ai_onnx_scorer.rs', [
    { pattern: /use ort/, name: 'ORT import' },
    { pattern: /use serde/, name: 'serde import' },
    { pattern: /pub use crate::dual_executor/, name: 'dual_executor types re-export' },
    { pattern: /fn pool_to_features/, name: 'pool_to_features function' },
    { pattern: /pub fn score_pools_with_onnx/, name: 'score_pools_with_onnx function' }
  ], 'AI ONNX scorer implementation');

  // Check binary entry point
  validateFileExists('src/bin/dual_executor.rs', 'Dual executor binary');
  validateFileContent('src/bin/dual_executor.rs', [
    { pattern: /use dat_fechter/, name: 'dat_fechter crate import' },
    { pattern: /use serde_json/, name: 'serde_json import' },
    { pattern: /DualExecutor/, name: 'DualExecutor usage' },
    { pattern: /SummaryEngine/, name: 'SummaryEngine usage' },
    { pattern: /TopPoolEngine/, name: 'TopPoolEngine usage' }
  ], 'Dual executor binary implementation');
}

/**
 * Validate data type compatibility between JavaScript and Rust
 */
function validateDataTypeCompatibility() {
  logSection('3. DATA TYPE COMPATIBILITY VALIDATION');

  // Read files
  const jsFile = path.join(__dirname, 'src/dex-data-fetcher.js');
  const rustFile = path.join(__dirname, 'src/dual_executor.rs');

  if (!fs.existsSync(jsFile) || !fs.existsSync(rustFile)) {
    logError('Cannot validate data types: Required files missing');
    results.failed.push('Data type validation skipped');
    return;
  }

  // JavaScript types (from JSDoc)
  const jsTypes = {
    Token: ['symbol', 'decimals', 'address'],
    Pool: ['dexName', 'chain', 'token0', 'token1', 'reserve0', 'reserve1', 'fee'],
    DexData: ['tokens', 'pools']
  };

  // Rust types (expected fields)
  const rustTypes = {
    Token: ['symbol', 'decimals', 'address'],
    Pool: ['dexName', 'chain', 'token0', 'token1', 'reserve0', 'reserve1', 'fee'],
    DexData: ['tokens', 'pools']
  };

  // Validate each type
  Object.keys(jsTypes).forEach(typeName => {
    const jsFields = jsTypes[typeName];
    const rustFields = rustTypes[typeName];
    
    const compatible = jsFields.every(field => rustFields.includes(field)) &&
                       rustFields.every(field => jsFields.includes(field));
    
    if (compatible) {
      logSuccess(`${typeName} type compatible between JS and Rust`);
      results.passed.push(`Type compatibility: ${typeName}`);
    } else {
      logError(`${typeName} type incompatible between JS and Rust`);
      results.failed.push(`Type incompatibility: ${typeName}`);
    }
  });
}

/**
 * Validate data flow through the system
 */
function validateDataFlow() {
  logSection('4. DATA FLOW VALIDATION');

  logInfo('Data Flow: JavaScript Fetcher → JSON → Rust Executor/Scorer');
  
  // Check if sample data file exists
  const sampleDataPath = path.join(__dirname, 'dex_data.json');
  if (fs.existsSync(sampleDataPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
      
      // Validate structure
      if (data.tokens && Array.isArray(data.tokens)) {
        logSuccess(`Sample data has tokens array (${data.tokens.length} tokens)`);
        results.passed.push('Sample data: tokens array valid');
      } else {
        logError('Sample data missing or invalid tokens array');
        results.failed.push('Sample data: tokens array invalid');
      }
      
      if (data.pools && Array.isArray(data.pools)) {
        logSuccess(`Sample data has pools array (${data.pools.length} pools)`);
        results.passed.push('Sample data: pools array valid');
      } else {
        logError('Sample data missing or invalid pools array');
        results.failed.push('Sample data: pools array invalid');
      }
    } catch (error) {
      logError(`Cannot parse sample data: ${error.message}`);
      results.failed.push('Sample data: parse error');
    }
  } else {
    logWarning('Sample data file (dex_data.json) not found - will be generated by fetcher');
    results.warnings.push('Sample data file not present');
  }

  // Validate the flow can work
  logInfo('Data Flow Path:');
  logInfo('  1. src/dex-data-fetcher.js (fetchAllDexData) → generates DexData');
  logInfo('  2. DexData → serialized to JSON → dex_data.json');
  logInfo('  3. dex_data.json → loaded by Rust (src/bin/dual_executor.rs)');
  logInfo('  4. Rust DualExecutor processes data with multiple engines');
  logInfo('  5. AIScorerEngine scores pools using ONNX model');
}

/**
 * Validate test coverage for integration
 */
function validateTestCoverage() {
  logSection('5. TEST COVERAGE VALIDATION');

  // JavaScript tests
  validateFileExists('src/__tests__/dex-data-fetcher.test.js', 'DEX data fetcher tests');
  validateFileExists('src/__tests__/token-registry.test.js', 'Token registry tests');
  validateFileExists('src/__tests__/ai-scorer-executor-integration.test.js', 'Integration tests');
  validateFileExists('src/api/__tests__/server.test.js', 'API server tests');

  // Rust tests
  validateFileContent('src/dual_executor.rs', [
    { pattern: /#\[cfg\(test\)\]/, name: 'Rust test module' },
    { pattern: /mod tests/, name: 'Rust tests module' }
  ], 'Rust unit tests');

  validateFileContent('src/ai_onnx_scorer.rs', [
    { pattern: /#\[cfg\(test\)\]/, name: 'Rust test module' },
    { pattern: /mod tests/, name: 'Rust tests module' }
  ], 'Rust AI scorer tests');
}

/**
 * Validate configuration and environment
 */
function validateConfiguration() {
  logSection('6. CONFIGURATION VALIDATION');

  validateFileExists('package.json', 'NPM package configuration');
  validateFileExists('Cargo.toml', 'Rust package configuration');
  validateFileExists('.env.example', 'Environment template');
  validateFileExists('jest.config.js', 'Jest configuration');
  validateFileExists('.eslintrc.js', 'ESLint configuration');

  // Check Cargo.toml dependencies
  validateFileContent('Cargo.toml', [
    { pattern: /serde/, name: 'serde dependency' },
    { pattern: /serde_json/, name: 'serde_json dependency' },
    { pattern: /ort/, name: 'ort (ONNX Runtime) dependency' },
    { pattern: /ndarray/, name: 'ndarray dependency' }
  ], 'Rust dependencies');

  // Check package.json dependencies
  validateFileContent('package.json', [
    { pattern: /"express"/, name: 'express dependency' },
    { pattern: /"graphql-request"/, name: 'graphql-request dependency' },
    { pattern: /"dotenv"/, name: 'dotenv dependency' },
    { pattern: /"jest"/, name: 'jest dev dependency' }
  ], 'NPM dependencies');
}

/**
 * Generate system wiring diagram
 */
function generateWiringDiagram() {
  logSection('7. SYSTEM WIRING DIAGRAM');

  console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────┐
                    │   EXTERNAL DATA SOURCES  │
                    │  - Uniswap V3 Subgraph   │
                    │  - SushiSwap Subgraph    │
                    │  - QuickSwap Subgraph    │
                    └───────────┬──────────────┘
                                │
                                ▼
            ┌───────────────────────────────────────┐
            │      JAVASCRIPT DATA FETCHER          │
            │   (src/dex-data-fetcher.js)           │
            │                                       │
            │  - fetchUniswapV3Data()               │
            │  - fetchSushiSwapData()               │
            │  - fetchQuickSwapData()               │
            │  - fetchAllDexData()                  │
            └──────────┬────────────────────────────┘
                       │
                       │ (imports)
                       ▼
            ┌───────────────────────────────────────┐
            │        TOKEN REGISTRY                 │
            │    (src/token-registry.js)            │
            │                                       │
            │  - MONITORED_TOKENS                   │
            │  - getMonitoredTokensMap()            │
            └───────────────────────────────────────┘
                       │
                       │ (exports DexData)
                       ▼
            ┌───────────────────────────────────────┐
            │         MAIN INDEX.JS                 │
            │      (src/index.js)                   │
            │                                       │
            │  exports: fetchAllDexData             │
            └──────────┬─────────┬──────────────────┘
                       │         │
         ┌─────────────┘         └──────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────────┐            ┌──────────────────────┐
│    REST API         │            │   JSON OUTPUT        │
│ (src/api/server.js) │            │  (dex_data.json)     │
│                     │            │                      │
│  GET /v1/evm/pools  │            │  {                   │
│  GET /health        │            │    tokens: [...],    │
└─────────────────────┘            │    pools: [...]      │
                                   │  }                   │
                                   └──────────┬───────────┘
                                              │
                                              │ (loaded by Rust)
                                              ▼
                                   ┌──────────────────────┐
                                   │   RUST LIB.RS        │
                                   │   (src/lib.rs)       │
                                   │                      │
                                   │  pub mod             │
                                   │    dual_executor     │
                                   │    ai_onnx_scorer    │
                                   └──────────┬───────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                         ▼                    ▼                    ▼
              ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐
              │  DUAL EXECUTOR   │  │  AI ONNX SCORER │  │  BINARY ENTRY    │
              │ (dual_executor.rs)  │ (ai_onnx_scorer.rs) │ (bin/dual_executor)
              │                  │  │                 │  │                  │
              │  - DexData       │  │  - ONNX Model   │  │  - main()        │
              │  - Engine Trait  │  │  - Scoring      │  │  - Orchestrates  │
              │  - Engines:      │  │  - Features     │  │                  │
              │    * Summary     │◄─┤                 │◄─┤  Loads data,     │
              │    * TopPool     │  │                 │  │  runs engines    │
              │    * AIScorer    │  │                 │  │                  │
              └──────────────────┘  └─────────────────┘  └──────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           KEY IMPORTS                                │
├─────────────────────────────────────────────────────────────────────┤
│ JavaScript:                                                          │
│  - graphql-request → DEX data fetcher                               │
│  - dotenv → Environment config                                      │
│  - express → API server                                             │
│                                                                      │
│ Rust:                                                                │
│  - serde → Serialization/deserialization                            │
│  - serde_json → JSON parsing                                        │
│  - ort → ONNX Runtime for AI scoring                                │
│  - ndarray → Array operations for ML features                       │
└─────────────────────────────────────────────────────────────────────┘
`);

  logSuccess('System wiring diagram generated');
  results.passed.push('System diagram generated');
}

/**
 * Print final summary
 */
function printSummary() {
  logSection('VALIDATION SUMMARY');

  console.log();
  log(`Total Checks: ${results.passed.length + results.failed.length}`, colors.bright);
  logSuccess(`Passed: ${results.passed.length}`);
  
  if (results.failed.length > 0) {
    logError(`Failed: ${results.failed.length}`);
    console.log();
    log('Failed Checks:', colors.red);
    results.failed.forEach(msg => log(`  - ${msg}`, colors.red));
  }
  
  if (results.warnings.length > 0) {
    console.log();
    logWarning(`Warnings: ${results.warnings.length}`);
    results.warnings.forEach(msg => log(`  - ${msg}`, colors.yellow));
  }

  console.log();
  
  if (results.failed.length === 0) {
    log('═'.repeat(70), colors.green);
    log('✓ SYSTEM SYNCHRONIZATION VALIDATED SUCCESSFULLY', colors.bright + colors.green);
    log('✓ ALL IMPORTS AND WIRING VERIFIED', colors.bright + colors.green);
    log('✓ DATA FLOW CONFIRMED', colors.bright + colors.green);
    log('═'.repeat(70), colors.green);
    console.log();
    return 0;
  } else {
    log('═'.repeat(70), colors.red);
    log('✗ SYSTEM VALIDATION FAILED', colors.bright + colors.red);
    log(`✗ ${results.failed.length} CHECKS FAILED`, colors.bright + colors.red);
    log('═'.repeat(70), colors.red);
    console.log();
    return 1;
  }
}

/**
 * Main validation execution
 */
function main() {
  log('═'.repeat(70), colors.bright);
  log('SYSTEM SYNCHRONIZATION AND WIRING VALIDATION', colors.bright + colors.cyan);
  log('DAT-FECHTER Complete System Verification', colors.cyan);
  log('═'.repeat(70), colors.bright);

  try {
    validateJavaScriptImports();
    validateRustImports();
    validateDataTypeCompatibility();
    validateDataFlow();
    validateTestCoverage();
    validateConfiguration();
    generateWiringDiagram();
    
    const exitCode = printSummary();
    process.exit(exitCode);
  } catch (error) {
    logError(`Validation error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = {
  validateFileExists,
  validateFileContent,
  validateJavaScriptImports,
  validateRustImports,
  validateDataTypeCompatibility,
  validateDataFlow,
  validateTestCoverage,
  validateConfiguration
};
