# GitHub Secrets Setup Guide

This guide explains how to configure GitHub repository secrets for running comprehensive tests in CI/CD environments.

## Why Secrets are Needed

The DEX Data Fetcher requires API credentials to:
- Connect to Ethereum and Polygon networks via RPC endpoints
- Access The Graph protocol for subgraph data
- Fetch real-time liquidity pool information

These credentials must be kept secure and should never be committed to the repository. GitHub Secrets provides a secure way to store and use sensitive information in GitHub Actions workflows.

## Required Secrets

You need to configure three secrets in your GitHub repository:

### 1. ETHEREUM_RPC_URL (Required)
- **Purpose**: RPC endpoint for Ethereum mainnet
- **Example**: `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **Providers**: Alchemy, Infura, QuickNode, Ankr

### 2. POLYGON_RPC_URL (Required)
- **Purpose**: RPC endpoint for Polygon mainnet
- **Example**: `https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **Providers**: Alchemy, Infura, QuickNode, Ankr

### 3. GRAPH_API_KEY (Optional)
- **Purpose**: API key for The Graph protocol
- **Example**: `abc123def456ghi789`
- **Provider**: [The Graph Studio](https://thegraph.com/studio/apikeys/)
- **Note**: Optional but recommended for better rate limits

## Step-by-Step Setup

### Step 1: Get Your API Credentials

#### For RPC URLs (Alchemy recommended):

1. Go to [Alchemy](https://www.alchemy.com/)
2. Sign up for a free account
3. Create a new app:
   - Click "Create App"
   - Choose "Ethereum" for Chain
   - Choose "Mainnet" for Network
   - Give it a name (e.g., "DEX Data Fetcher")
4. Copy the HTTPS URL (it looks like: `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`)
5. Repeat for Polygon:
   - Create another app
   - Choose "Polygon" for Chain
   - Choose "Mainnet" for Network
   - Copy the HTTPS URL

#### For The Graph API Key (optional):

1. Go to [The Graph Studio](https://thegraph.com/studio/apikeys/)
2. Sign in or create an account
3. Create a new API key
4. Copy the key

### Step 2: Add Secrets to GitHub Repository

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click on "Settings" tab

2. **Access Secrets Section**
   - In the left sidebar, click "Secrets and variables"
   - Click "Actions"

3. **Add New Secret**
   - Click the "New repository secret" button
   - Add each secret one by one:

#### Adding ETHEREUM_RPC_URL:
- **Name**: `ETHEREUM_RPC_URL`
- **Value**: Your Ethereum RPC URL (e.g., `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`)
- Click "Add secret"

#### Adding POLYGON_RPC_URL:
- **Name**: `POLYGON_RPC_URL`
- **Value**: Your Polygon RPC URL (e.g., `https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY`)
- Click "Add secret"

#### Adding GRAPH_API_KEY (optional):
- **Name**: `GRAPH_API_KEY`
- **Value**: Your The Graph API key
- Click "Add secret"

### Step 3: Verify Secrets are Configured

After adding all secrets, you should see them listed (but not their values):

```
ETHEREUM_RPC_URL        Updated X seconds ago
POLYGON_RPC_URL         Updated X seconds ago
GRAPH_API_KEY           Updated X seconds ago
```

## Testing the Setup

### Method 1: Automatic Test on Push

Simply push code to your repository. The GitHub Actions workflow will automatically run tests using your configured secrets.

```bash
git push origin main
```

### Method 2: Manual Workflow Trigger

1. Go to the "Actions" tab in your repository
2. Select "Comprehensive Tests" workflow
3. Click "Run workflow"
4. Select the branch to run tests on
5. Click "Run workflow" button

### Method 3: Pull Request

Create a pull request, and tests will automatically run with the configured secrets.

## Viewing Test Results

1. Go to the "Actions" tab
2. Click on the workflow run
3. Click on the job name (e.g., "test (18.x)")
4. Expand the test step to see detailed results

You should see output like:

```
✓ ETHEREUM_RPC_URL is configured
✓ POLYGON_RPC_URL is configured
✓ GRAPH_API_KEY is configured
✓ Configuration loaded successfully
```

## Security Best Practices

### DO:
- ✅ Use separate API keys for different environments
- ✅ Rotate API keys regularly
- ✅ Use free tier accounts for testing
- ✅ Monitor API usage to detect unusual activity
- ✅ Keep secrets in GitHub Secrets, never in code

### DON'T:
- ❌ Commit API keys or secrets to the repository
- ❌ Share API keys publicly
- ❌ Use production API keys for testing
- ❌ Log full API keys in test output
- ❌ Expose secrets in error messages

## Troubleshooting

### Tests Failing with "ETHEREUM_RPC_URL is required"

**Cause**: Secret not configured or named incorrectly

**Solution**:
1. Verify secret name is exactly `ETHEREUM_RPC_URL` (case-sensitive)
2. Check that the secret value is a valid URL
3. Ensure secret is added to repository secrets, not environment secrets

### Tests Failing with Network Errors

**Cause**: Invalid or expired API key

**Solution**:
1. Verify API key is valid in your provider's dashboard
2. Check API key hasn't expired
3. Ensure you haven't exceeded rate limits
4. Try generating a new API key

### Tests Pass Locally but Fail in GitHub Actions

**Cause**: Secrets not configured in GitHub or local .env differs from GitHub secrets

**Solution**:
1. Double-check all secrets are configured in GitHub
2. Verify secret names match exactly
3. Test with a fresh API key to rule out quota issues

### "Permission denied" when accessing secrets

**Cause**: Workflow doesn't have permission to access secrets

**Solution**:
1. Ensure the workflow file is on a protected branch (main/develop)
2. Check repository settings allow Actions to access secrets
3. Verify you're not in a forked repository (secrets don't transfer to forks)

## Advanced Configuration

### Using Environment Secrets

For organization-wide secrets:

1. Go to organization settings
2. Navigate to "Secrets and variables" → "Actions"
3. Create organization secrets
4. Select which repositories can access them

### Using Multiple Environments

Create separate environments (e.g., staging, production):

1. Repository Settings → Environments
2. Create new environment
3. Add environment-specific secrets
4. Update workflow to use specific environments

### Updating Secrets

To update a secret:

1. Go to repository Settings → Secrets and variables → Actions
2. Click on the secret name
3. Click "Update secret"
4. Enter new value
5. Click "Update secret"

## Cost Considerations

### Free Tier Limits

Most providers offer generous free tiers:

- **Alchemy**: 300M compute units/month (free)
- **Infura**: 100,000 requests/day (free)
- **The Graph**: 100,000 queries/month (free)

These limits are typically more than sufficient for running automated tests.

### Monitoring Usage

Check your usage regularly:
- Alchemy: Dashboard → Usage
- Infura: Dashboard → Stats
- The Graph: Studio → Billing

## Next Steps

After configuring secrets:

1. ✅ Run your first automated test
2. ✅ Monitor test results in Actions tab
3. ✅ Set up branch protection to require passing tests
4. ✅ Configure notifications for failed tests
5. ✅ Review test coverage reports

---

**Need Help?** 
- Check [TESTING.md](TESTING.md) for local testing guide
- Review [README.md](README.md) for project overview
- Open an issue if you encounter problems
