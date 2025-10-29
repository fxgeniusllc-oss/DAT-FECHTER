# Testing Guide

This guide explains how to run comprehensive tests for the DEX Data Fetcher in different environments using your secrets and environment variables.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Testing](#local-testing)
- [GitHub Actions / CI/CD Testing](#github-actions--cicd-testing)
- [Test Coverage](#test-coverage)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before running tests, ensure you have:

1. **Node.js** (v18.x or v20.x recommended)
2. **npm** (comes with Node.js)
3. **RPC URLs** for Ethereum and Polygon networks
4. **(Optional)** The Graph API key for better rate limits

### Getting Your Secrets

#### RPC URLs
Get your RPC URLs from providers like:
- [Alchemy](https://www.alchemy.com/) - Recommended
- [Infura](https://infura.io/)
- [QuickNode](https://www.quicknode.com/)
- [Ankr](https://www.ankr.com/)

#### The Graph API Key
Get your API key from [The Graph Studio](https://thegraph.com/studio/apikeys/)

## Local Testing

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd DAT-FECHTER

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your secrets
nano .env  # or use your preferred editor
```

Your `.env` file should look like:

```env
# RPC Endpoints
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ACTUAL_API_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_ACTUAL_API_KEY

# The Graph API Key (optional)
GRAPH_API_KEY=YOUR_ACTUAL_GRAPH_API_KEY
```

### Step 3: Run Tests

#### Using the Test Runner Script (Recommended)

```bash
# Run comprehensive tests with environment validation
./run-tests.sh
```

This script will:
- ✓ Check if `.env` exists
- ✓ Validate required environment variables
- ✓ Install dependencies if needed
- ✓ Build the TypeScript code
- ✓ Run all tests with your secrets

#### Using npm Commands

```bash
# Build the project
npm run build

# Run tests with .env file
npm run test:env

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch
```

### Step 4: Review Results

The tests will display detailed output including:
- Environment variable validation
- Configuration checks
- Data fetching from DEXes
- Data structure validation
- Performance metrics
- Code coverage (if running with coverage flag)

## GitHub Actions / CI/CD Testing

### Setting Up GitHub Secrets

To run comprehensive tests in GitHub Actions, you need to configure repository secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `ETHEREUM_RPC_URL` | Your Ethereum mainnet RPC endpoint | ✓ Yes |
| `POLYGON_RPC_URL` | Your Polygon mainnet RPC endpoint | ✓ Yes |
| `GRAPH_API_KEY` | Your The Graph API key | ✗ Optional |

### Running Tests in GitHub Actions

Tests automatically run on:
- Push to `main`, `develop`, or `copilot/**` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

#### Manual Trigger

1. Go to **Actions** tab in your repository
2. Select **Comprehensive Tests** workflow
3. Click **Run workflow**
4. Select the branch
5. Click **Run workflow** button

The workflow will:
- Run tests on Node.js 18.x and 20.x
- Use your configured secrets
- Build the project
- Run all test suites
- Generate coverage reports
- Upload artifacts

### Viewing Test Results

1. Go to the **Actions** tab
2. Click on the workflow run
3. View the test output in the job logs
4. Download test artifacts (coverage reports, etc.)

## Test Coverage

The test suite includes:

### Environment Tests
- ✓ Validates `ETHEREUM_RPC_URL` is loaded
- ✓ Validates `POLYGON_RPC_URL` is loaded
- ✓ Checks for optional `GRAPH_API_KEY`
- ✓ Verifies configuration creation

### Configuration Tests
- ✓ Throws error for missing Ethereum RPC URL
- ✓ Throws error for missing Polygon RPC URL
- ✓ Accepts valid configurations

### Integration Tests
- ✓ Fetches real data from DEXes using credentials
- ✓ Validates token structure (symbol, decimals, address)
- ✓ Validates pool structure (reserves, fees, chain)
- ✓ Checks data from multiple DEXes
- ✓ Ensures unique token addresses
- ✓ Verifies address normalization

### Error Handling Tests
- ✓ Handles network errors gracefully
- ✓ Returns empty results on failures

### Performance Tests
- ✓ Measures data fetch duration
- ✓ Ensures completion within time limits

### Data Quality Tests
- ✓ Validates decimal ranges (0-18)
- ✓ Ensures non-negative reserves
- ✓ Validates fee ranges

## Troubleshooting

### Common Issues

#### "ETHEREUM_RPC_URL is required" Error

**Problem**: Environment variable not set
**Solution**: 
```bash
# Make sure .env file exists and contains valid URLs
cat .env | grep ETHEREUM_RPC_URL
```

#### "Cannot find module" Error

**Problem**: Dependencies not installed
**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Test Timeout Errors

**Problem**: API calls taking too long
**Solution**:
- Check your internet connection
- Verify RPC URLs are correct and active
- Consider using a premium RPC provider
- The timeout is set to 30 seconds; this should be sufficient

#### Rate Limiting Issues

**Problem**: Too many requests to The Graph
**Solution**:
- Configure `GRAPH_API_KEY` in your `.env` file
- Get a free API key from [The Graph Studio](https://thegraph.com/studio/apikeys/)

#### GitHub Actions Failing

**Problem**: Tests pass locally but fail in CI
**Solution**:
- Verify all secrets are configured in GitHub repository settings
- Check secret names match exactly: `ETHEREUM_RPC_URL`, `POLYGON_RPC_URL`, `GRAPH_API_KEY`
- Review the Actions logs for specific error messages

### Getting Help

If you encounter issues:

1. Check that all environment variables are properly set
2. Verify your RPC URLs are valid and have sufficient quota
3. Review test output for specific error messages
4. Check the GitHub Actions logs if running in CI/CD

### Debug Mode

To get more detailed output:

```bash
# Run tests with verbose logging
DEBUG=* npm run test:env

# Run a specific test suite
npm test -- --testNamePattern="Environment Variables"
```

## Best Practices

1. **Never commit `.env` files** - They contain sensitive secrets
2. **Use strong RPC providers** - Free tier is fine for testing
3. **Rotate secrets regularly** - Update API keys periodically
4. **Monitor rate limits** - Track your API usage
5. **Test before deploying** - Run full test suite locally first

## Test Statistics

After running tests, you'll see output like:

```
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        15.234 s
```

With coverage enabled:

```
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   95.24 |    88.89 |     100 |   95.24 |
 dex-data-fetcher.ts      |   95.24 |    88.89 |     100 |   95.24 |
```

---

**Questions?** Open an issue in the repository or check the main [README.md](README.md) for general information.
