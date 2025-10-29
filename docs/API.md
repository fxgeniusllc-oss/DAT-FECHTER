# Liquidity Pools API

This API provides access to liquidity pool metadata from multiple decentralized exchanges (DEXes) including Uniswap V3, SushiSwap, and QuickSwap across various EVM networks.

## Base URL

```
http://localhost:3000
```

## Endpoints

### Health Check

```
GET /health
```

Returns the health status of the API server.

**Response:**
```json
{
  "status": "ok"
}
```

### Get Liquidity Pools

```
GET /v1/evm/pools
```

Returns Uniswap liquidity pool metadata including token pairs, fees, and protocol versions.

#### Query Parameters

| Parameter | Type | Description | Required | Default |
|-----------|------|-------------|----------|---------|
| `network` | string | The Graph Network ID for EVM networks. Accepted values: `arbitrum-one`, `avalanche`, `base`, `bsc`, `mainnet`, `optimism`, `polygon`, `unichain` | No | All networks |
| `factory` | string | Filter by factory address. Supports single value or comma-separated array of values. | No | - |
| `pool` | string | Filter by pool address. Supports single value or comma-separated array of values. | No | - |
| `input_token` | string | Filter by input token contract address. Supports single value or comma-separated array of values. | No | - |
| `output_token` | string | Filter by output token contract address. Supports single value or comma-separated array of values. | No | - |
| `protocol` | string | Protocol name. Accepted values: `uniswap_v2`, `uniswap_v3`, `uniswap_v4` | No | All protocols |
| `limit` | integer | Number of items returned in a single request. Min: 1, Max: 1000 | No | 10 |
| `page` | integer | Page number to fetch. Min: 1, Max: 767465558638 | No | 1 |

#### Response Format

```json
{
  "data": [
    {
      "id": "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
      "factory": "0x1f98431c8ad98523631ae4a59f267346ea31f984",
      "token0": {
        "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "symbol": "USDC",
        "decimals": 6
      },
      "token1": {
        "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "symbol": "WETH",
        "decimals": 18
      },
      "reserve0": "1000000000000000000",
      "reserve1": "2000000000000000000",
      "fee": "3000",
      "protocol": "Uniswap V3",
      "network": "Ethereum"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "hasMore": true
  }
}
```

#### Example Requests

**Get all pools (default pagination):**
```bash
curl http://localhost:3000/v1/evm/pools
```

**Get pools on Ethereum mainnet:**
```bash
curl http://localhost:3000/v1/evm/pools?network=mainnet
```

**Get Uniswap V3 pools only:**
```bash
curl http://localhost:3000/v1/evm/pools?protocol=uniswap_v3
```

**Get pools containing a specific token:**
```bash
curl http://localhost:3000/v1/evm/pools?input_token=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
```

**Get pools with pagination:**
```bash
curl http://localhost:3000/v1/evm/pools?limit=50&page=2
```

**Combine multiple filters:**
```bash
curl http://localhost:3000/v1/evm/pools?network=mainnet&protocol=uniswap_v3&limit=20
```

**Filter by multiple pool addresses:**
```bash
curl "http://localhost:3000/v1/evm/pools?pool=0xpool1,0xpool2,0xpool3"
```

#### Response Fields

- `id`: Pool contract address
- `factory`: Factory contract address that created the pool (may be null for some protocols)
- `token0`: First token in the pair
  - `address`: Token contract address
  - `symbol`: Token symbol
  - `decimals`: Number of decimals
- `token1`: Second token in the pair
- `reserve0`: Reserve amount of token0 (as string to preserve precision)
- `reserve1`: Reserve amount of token1 (as string to preserve precision)
- `fee`: Fee tier as basis points (e.g., 3000 = 0.3%)
- `protocol`: DEX protocol name
- `network`: Blockchain network name

#### Error Responses

**400 Bad Request** - Invalid query parameters:
```json
{
  "error": "Invalid network parameter. Accepted values: arbitrum-one, avalanche, base, bsc, mainnet, optimism, polygon, unichain"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "error": "Internal server error",
  "message": "Error details"
}
```

## Running the Server

### Development Mode

```bash
# With environment variables from .env file
npm run start:dev
```

### Production Mode

```bash
# Make sure environment variables are set
npm start
```

### Required Environment Variables

```bash
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
GRAPH_API_KEY=YOUR_GRAPH_API_KEY  # Optional but recommended
PORT=3000  # Optional, defaults to 3000
```

## Testing

Run the comprehensive test suite:

```bash
npm test -- src/api/__tests__/server.test.js
```

The test suite includes:
- 24 comprehensive tests
- Pagination tests
- Network filtering tests
- Protocol filtering tests
- Token filtering tests
- Pool and factory filtering tests
- Combined filter tests
- Error handling tests
- Data format validation tests

## Architecture

The API server is built with:
- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **graphql-request** - GraphQL client for subgraph queries

The server integrates with the existing `dex-data-fetcher` module to fetch real-time liquidity pool data from The Graph protocol subgraphs.

## Network Mapping

| Network ID | Blockchain |
|------------|------------|
| `arbitrum-one` | Arbitrum |
| `avalanche` | Avalanche |
| `base` | Base |
| `bsc` | BSC |
| `mainnet` | Ethereum |
| `optimism` | Optimism |
| `polygon` | Polygon |
| `unichain` | Unichain |

## Protocol Mapping

| Protocol ID | DEX Name |
|-------------|----------|
| `uniswap_v2` | Uniswap V2 |
| `uniswap_v3` | Uniswap V3 |
| `uniswap_v4` | Uniswap V4 |

Note: Currently, the implementation fetches data from Uniswap V3, SushiSwap, and QuickSwap. Additional protocol support can be added by extending the `dex-data-fetcher` module.
