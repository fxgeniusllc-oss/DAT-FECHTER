use ort::{Environment, SessionBuilder, Value};
use serde::{Deserialize};
use std::error::Error;
use std::path::Path;

// Types matching DAT-FECHTER output
#[derive(Debug, Deserialize)]
pub struct Token {
    pub symbol: String,
    pub decimals: u32,
    pub address: String,
}

#[derive(Debug, Deserialize)]
pub struct Pool {
    pub dexName: String,
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

/// Converts a Pool to a feature vector for ONNX input.
/// You should adapt this function to your model's expected input.
fn pool_to_features(pool: &Pool) -> Vec<f32> {
    vec![
        pool.reserve0 as f32,
        pool.reserve1 as f32,
        pool.fee as f32,
        // Optionally: use one-hot or embedding for dexName, chain, etc.
    ]
}

/// Scores all pools using an ONNX model. Returns a Vec of (score, &Pool).
pub fn score_pools_with_onnx(
    dex_data: &DexData,
    model_path: &Path,
) -> Result<Vec<(f32, &Pool)>, Box<dyn Error>> {
    // Setup ONNX environment and session
    let environment = Environment::builder().with_name("ai-onnx-scorer").build()?;
    let session = SessionBuilder::new(&environment)?
        .with_model_from_file(model_path)?;

    let mut results = Vec::new();

    for pool in &dex_data.pools {
        let features = pool_to_features(pool);
        let input_shape = [1, features.len() as i64];
        let input_tensor = Value::from_array(ndarray::Array2::from_shape_vec(
            (1, features.len()),
            features,
        )?);
        let outputs = session.run(vec![input_tensor])?;
        // Assume single output score; adapt as needed for your model
        let score = outputs[0]
            .try_extract::<ndarray::ArrayViewD<f32>>()?
            .iter()
            .next()
            .copied()
            .unwrap_or(0.0);
        results.push((score, pool));
    }
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_integration() {
        // Load test data
        let json = fs::read_to_string("dex_data.json").unwrap();
        let dex_data: DexData = serde_json::from_str(&json).unwrap();
        // Use a dummy ONNX model for tests, or mock the session
        let model_path = Path::new("model.onnx");
        let result = score_pools_with_onnx(&dex_data, model_path);
        assert!(result.is_ok());
    }
}
