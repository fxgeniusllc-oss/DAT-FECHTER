# API Usage Examples

This document provides practical examples of using the Liquidity Pools API.

## Getting Started

Start the API server:

```bash
npm run start:dev
```

The server will be available at `http://localhost:3000`

## Basic Examples

### 1. Health Check

Check if the API server is running:

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok"
}
```

### 2. Get All Pools (Default)

Retrieve the first 10 pools:

```bash
curl http://localhost:3000/v1/evm/pools
```

### 3. Get Pools with Custom Limit

Retrieve 50 pools per page:

```bash
curl http://localhost:3000/v1/evm/pools?limit=50
```

### 4. Navigate Through Pages

Get the second page of results:

```bash
curl http://localhost:3000/v1/evm/pools?limit=20&page=2
```

## Filtering Examples

### By Network

Get pools on Ethereum mainnet:

```bash
curl http://localhost:3000/v1/evm/pools?network=mainnet
```

Get pools on Polygon:

```bash
curl http://localhost:3000/v1/evm/pools?network=polygon
```

### By Protocol

Get Uniswap V3 pools only:

```bash
curl http://localhost:3000/v1/evm/pools?protocol=uniswap_v3
```

### By Token Address

Get all pools containing WETH:

```bash
curl http://localhost:3000/v1/evm/pools?input_token=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
```

Get all pools with USDC as output token:

```bash
curl http://localhost:3000/v1/evm/pools?output_token=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
```

### By Pool Address

Get a specific pool:

```bash
curl http://localhost:3000/v1/evm/pools?pool=0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8
```

Get multiple specific pools:

```bash
curl "http://localhost:3000/v1/evm/pools?pool=0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8,0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
```

### By Factory Address

Get pools from a specific factory:

```bash
curl http://localhost:3000/v1/evm/pools?factory=0x1f98431c8ad98523631ae4a59f267346ea31f984
```

## Combined Filters

### Mainnet Uniswap V3 Pools

```bash
curl http://localhost:3000/v1/evm/pools?network=mainnet&protocol=uniswap_v3
```

### WETH Pools on Mainnet with Pagination

```bash
curl http://localhost:3000/v1/evm/pools?network=mainnet&input_token=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&limit=25
```

### Specific Token Pair

Find pools with WETH and USDC:

```bash
curl "http://localhost:3000/v1/evm/pools?input_token=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2&output_token=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
```

## JavaScript/Node.js Examples

### Using fetch API

```javascript
async function getMainnetPools() {
  const response = await fetch('http://localhost:3000/v1/evm/pools?network=mainnet&limit=50');
  const data = await response.json();
  
  console.log(`Found ${data.pagination.total} pools`);
  console.log(`Current page: ${data.pagination.page}`);
  console.log(`Has more: ${data.pagination.hasMore}`);
  
  data.data.forEach(pool => {
    console.log(`Pool: ${pool.id}`);
    console.log(`  ${pool.token0.symbol}/${pool.token1.symbol}`);
    console.log(`  Protocol: ${pool.protocol}`);
    console.log(`  Fee: ${pool.fee} basis points`);
  });
}

getMainnetPools();
```

### Using axios

```javascript
const axios = require('axios');

async function getUniswapV3Pools() {
  try {
    const response = await axios.get('http://localhost:3000/v1/evm/pools', {
      params: {
        network: 'mainnet',
        protocol: 'uniswap_v3',
        limit: 100
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching pools:', error.message);
    throw error;
  }
}
```

### Pagination Example

```javascript
async function getAllPools() {
  const allPools = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `http://localhost:3000/v1/evm/pools?limit=100&page=${page}`
    );
    const data = await response.json();
    
    allPools.push(...data.data);
    hasMore = data.pagination.hasMore;
    page++;
    
    console.log(`Fetched page ${page - 1}: ${data.data.length} pools`);
  }
  
  return allPools;
}
```

## Python Examples

### Using requests

```python
import requests

def get_mainnet_pools():
    url = "http://localhost:3000/v1/evm/pools"
    params = {
        "network": "mainnet",
        "protocol": "uniswap_v3",
        "limit": 50
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    print(f"Found {data['pagination']['total']} pools")
    
    for pool in data['data']:
        print(f"Pool: {pool['id']}")
        print(f"  {pool['token0']['symbol']}/{pool['token1']['symbol']}")
        print(f"  Reserve0: {pool['reserve0']}")
        print(f"  Reserve1: {pool['reserve1']}")

if __name__ == "__main__":
    get_mainnet_pools()
```

### Pagination in Python

```python
import requests

def get_all_pools():
    base_url = "http://localhost:3000/v1/evm/pools"
    all_pools = []
    page = 1
    
    while True:
        response = requests.get(base_url, params={"limit": 100, "page": page})
        data = response.json()
        
        all_pools.extend(data['data'])
        
        if not data['pagination']['hasMore']:
            break
            
        page += 1
        print(f"Fetched page {page - 1}: {len(data['data'])} pools")
    
    return all_pools
```

## Response Structure

Every successful response includes:

```json
{
  "data": [
    {
      "id": "string (pool address)",
      "factory": "string (factory address) or null",
      "token0": {
        "address": "string",
        "symbol": "string",
        "decimals": "number"
      },
      "token1": {
        "address": "string",
        "symbol": "string",
        "decimals": "number"
      },
      "reserve0": "string (BigInt as string)",
      "reserve1": "string (BigInt as string)",
      "fee": "string (basis points)",
      "protocol": "string (DEX name)",
      "network": "string (blockchain name)"
    }
  ],
  "pagination": {
    "page": "number (current page)",
    "limit": "number (items per page)",
    "total": "number (total matching items)",
    "hasMore": "boolean (more pages available)"
  }
}
```

## Error Handling

### Invalid Parameters

```bash
curl http://localhost:3000/v1/evm/pools?network=invalid
```

**Response (400):**
```json
{
  "error": "Invalid network parameter. Accepted values: arbitrum-one, avalanche, base, bsc, mainnet, optimism, polygon, unichain"
}
```

### Invalid Pagination

```bash
curl http://localhost:3000/v1/evm/pools?page=0
```

**Response (400):**
```json
{
  "error": "Invalid page parameter. Must be >= 1"
}
```

## Tips

1. **Use pagination** for large result sets to avoid timeouts
2. **Combine filters** to narrow down results efficiently
3. **Parse BigInt strings** carefully in your application (use BigInt libraries)
4. **Cache results** when appropriate to reduce API calls
5. **Handle errors** gracefully in production code
6. **Check `hasMore`** to implement complete pagination
7. **URL encode** comma-separated values if needed

## Additional Resources

- [Full API Documentation](API.md)
- [Project README](../README.md)
- [Testing Guide](../TESTING.md)
