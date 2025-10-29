#!/bin/bash

# Update package.json
cat > package.json << 'EOF'
{
  "name": "dex-data-fetcher",
  "version": "1.0.0",
  "description": "DEX Data Fetcher - Aggregate and normalize liquidity pool data from multiple DEXes",
  "main": "src/index.js",
  "scripts": {
    "test": "jest",
    "test:env": "dotenv -e .env -- jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.js",
    "clean": "echo 'No build artifacts to clean'"
  },
  "keywords": [
    "dex",
    "defi",
    "uniswap",
    "sushiswap",
    "quickswap",
    "liquidity",
    "arbitrage"
  ],
  "author": "fxgeniusllc",
  "license": "MIT",
  "devDependencies": {
    "dotenv-cli": "^7.3.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0"
  },
  "dependencies": {
    "dotenv": "^16.3.1",
    "graphql": "^16.8.1",
    "graphql-request": "^6.1.0"
  }
}
EOF

# Update jest.config.js
cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
EOF

# Update .eslintrc.js
cat > .eslintrc.js << 'EOF'
module.exports = {
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn',
  },
  env: {
    node: true,
    es6: true,
    es2020: true,
    jest: true,
  },
  globals: {
    BigInt: 'readonly'
  }
};
EOF

# Update .gitignore
cat > .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build output
dist/
build/
*.js.map

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
.cache/
EOF

echo "Configuration files updated"
