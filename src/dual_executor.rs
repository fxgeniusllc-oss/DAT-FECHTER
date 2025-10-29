use serde::Deserialize;

// Structures matching the fetcher output
#[derive(Debug, Deserialize)]
pub struct Token {
    pub symbol: String,
    pub decimals: u32,
    pub address: String,
}

#[derive(Debug, Deserialize)]
pub struct Pool {
    #[serde(rename = "dexName")]
    pub dex_name: String,
    pub chain: String,
    pub token0: String,
    pub token1: String,
    pub reserve0: u64,
    pub reserve1: u64,
    pub fee: u64,
}

#[derive(Debug, Deserialize)]
pub struct DexData {
    pub tokens: Vec<Token>,
    pub pools: Vec<Pool>,
}

// Engine trait
pub trait Engine {
    fn execute(&self, data: &DexData);
}

// First engine example: prints summary stats
pub struct SummaryEngine;
impl Engine for SummaryEngine {
    fn execute(&self, data: &DexData) {
        println!("SummaryEngine: {} tokens, {} pools", data.tokens.len(), data.pools.len());
    }
}

// Second engine example: prints top pool by reserve
pub struct TopPoolEngine;
impl Engine for TopPoolEngine {
    fn execute(&self, data: &DexData) {
        if let Some(top_pool) = data.pools.iter().max_by_key(|p| p.reserve0 + p.reserve1) {
            println!("TopPoolEngine: Top pool is {} with reserve0+reserve1={}", 
                top_pool.dex_name, top_pool.reserve0 + top_pool.reserve1);
        }
    }
}

// Dual executor
pub struct DualExecutor {
    engines: Vec<Box<dyn Engine>>,
}

impl DualExecutor {
    pub fn new() -> Self {
        DualExecutor { engines: Vec::new() }
    }
    
    pub fn add_engine(&mut self, engine: Box<dyn Engine>) {
        self.engines.push(engine);
    }
    
    pub fn run(&self, data: &DexData) {
        for engine in &self.engines {
            engine.execute(data);
        }
    }
}

impl Default for DualExecutor {
    fn default() -> Self {
        Self::new()
    }
}
