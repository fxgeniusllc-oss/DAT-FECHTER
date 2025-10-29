/**
 * Token Registry - Defines tokens to monitor across DEXes
 * These tokens are monitored across all active DEX and liquidity pools
 */

/**
 * @typedef {Object} MonitoredToken
 * @property {string} symbol - Token symbol
 * @property {string} address - Token contract address (checksum format)
 */

/**
 * List of tokens to monitor on Polygon network
 * @type {MonitoredToken[]}
 */
const MONITORED_TOKENS = [
  {
    symbol: 'WMATIC',
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
  },
  {
    symbol: 'USDC',
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  },
  {
    symbol: 'USDT',
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
  },
  {
    symbol: 'DAI',
    address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  },
  {
    symbol: 'WETH',
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
  },
  {
    symbol: 'WBTC',
    address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'
  },
  {
    symbol: 'LINK',
    address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39'
  },
  {
    symbol: 'AAVE',
    address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B'
  },
  {
    symbol: 'UNI',
    address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f'
  },
  {
    symbol: 'QUICK',
    address: '0x831753DD7087CaC61aB5644b308642cc1c33Dc13'
  },
  {
    symbol: 'SUSHI',
    address: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a'
  },
  {
    symbol: 'CRV',
    address: '0x172370d5Cd63279eFa6d502DAB29171933a610AF'
  },
  {
    symbol: 'BAL',
    address: '0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3'
  },
  {
    symbol: 'SAND',
    address: '0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683'
  },
  {
    symbol: 'MANA',
    address: '0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4'
  }
];

/**
 * Cached map of token addresses (lowercase) to token info
 * @type {Map<string, MonitoredToken>}
 */
const MONITORED_TOKENS_MAP = (() => {
  const map = new Map();
  MONITORED_TOKENS.forEach(token => {
    map.set(token.address.toLowerCase(), token);
  });
  return map;
})();

/**
 * Get the cached map of token addresses to token info
 * @returns {Map<string, MonitoredToken>} Map of lowercase addresses to token info
 */
function getMonitoredTokensMap() {
  return MONITORED_TOKENS_MAP;
}

/**
 * Check if a token address is in the monitored list
 * @param {string} address - Token address to check
 * @returns {boolean} True if token is monitored
 */
function isMonitoredToken(address) {
  const lowerAddress = address.toLowerCase();
  return MONITORED_TOKENS.some(token => token.address.toLowerCase() === lowerAddress);
}

/**
 * Get token info by address
 * @param {string} address - Token address
 * @returns {MonitoredToken|undefined} Token info if found
 */
function getTokenInfo(address) {
  const lowerAddress = address.toLowerCase();
  return MONITORED_TOKENS.find(token => token.address.toLowerCase() === lowerAddress);
}

module.exports = {
  MONITORED_TOKENS,
  getMonitoredTokensMap,
  isMonitoredToken,
  getTokenInfo
};
