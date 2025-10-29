use dat_fechter::dual_executor::{DualExecutor, SummaryEngine, TopPoolEngine, DexData};
use std::error::Error;
use std::fs;
use serde_json;

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
