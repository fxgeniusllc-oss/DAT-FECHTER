const { fetchAllDexData, getConfigFromEnv } = require('path-to-DAT-FECHTER/src/index.js');

async function main() {
  const config = getConfigFromEnv();
  const { tokens, pools } = await fetchAllDexData(config);

  const results = yourAIScorerOrExecutor({ tokens, pools });
  console.log(results);
}

main();use serde::{Deserialize};
use std::fs;
use std::error::Error;

// Structures matching the fetcher output
#[derive(Debug, Deserialize)]
struct Token {
    symbol: String,
    decimals: u32,
    address: String,
}

#[derive(Debug, Deserialize)]
struct Pool {
    dexName: String,
    chain: String,
    token0: String,
    token1: String,
    reserve0: u64,
    reserve1: u64,
    fee: u64,
}

#[derive(Debug, Deserialize)]
struct DexData {
    tokens: Vec<Token>,
    pools: Vec<Pool>,
}

// Engine trait
trait Engine {
    fn execute(&self, data: &DexData);
}

// First engine example: prints summary stats
struct SummaryEngine;
impl Engine for SummaryEngine {
    fn execute(&self, data: &DexData) {
        println!("SummaryEngine: {} tokens, {} pools", data.tokens.len(), data.pools.len());
    }
}

// Second engine example: prints top pool by reserve
struct TopPoolEngine;
impl Engine for TopPoolEngine {
    fn execute(&self, data: &DexData) {
        if let Some(top_pool) = data.pools.iter().max_by_key(|p| p.reserve0 + p.reserve1) {
            println!("TopPoolEngine: Top pool is {} with reserve0+reserve1={}", 
                top_pool.dexName, top_pool.reserve0 + top_pool.reserve1);
        }
    }
}

// Dual executor
struct DualExecutor {
    engines: Vec<Box<dyn Engine>>,
}

impl DualExecutor {
    fn new() -> Self {
        DualExecutor { engines: Vec::new() }
    }
    fn add_engine(&mut self, engine: Box<dyn Engine>) {
        self.engines.push(engine);
    }
    fn run(&self, data: &DexData) {
        for engine in &self.engines {
            engine.execute(data);
        }
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    // Load data fetcher output
    let json = fs::read_to_string("dex_data.json")?;
    let dex_data: DexData = serde_json::from_str(&json)?;

    // Setup executor and engines
    let mut executor = DualExecutor::new();
    executor.add_engine(Box::new(SummaryEngine));
    executor.add_engine(Box::new(TopPoolEngine));
    executor.run(&dex_data);

    Ok(())
}
