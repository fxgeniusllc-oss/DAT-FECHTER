use ort::session::Session;
use ort::value::Value;
use std::error::Error;
use std::path::Path;

// Re-export types from dual_executor module
pub use crate::dual_executor::{DexData, Pool, Token};

/// Converts a Pool to a feature vector for ONNX input.
/// You should adapt this function to your model's expected input.
fn pool_to_features(pool: &Pool) -> Vec<f32> {
    vec![
        pool.reserve0 as f32,
        pool.reserve1 as f32,
        pool.fee as f32,
        // Optionally: use one-hot or embedding for dex_name, chain, etc.
    ]
}

/// Scores all pools using an ONNX model. Returns a Vec of (score, Pool reference).
/// 
/// # Arguments
/// * `dex_data` - The DEX data containing pools to score
/// * `model_path` - Path to the ONNX model file
/// 
/// # Note
/// This function uses the ort v2.0.0-rc.10 API. The API may differ in other versions.
/// Ensure ONNX Runtime is properly installed or enable the `download-binaries` feature.
/// 
/// # Example
/// ```ignore
/// let dex_data = load_dex_data("dex_data.json")?;
/// let scores = score_pools_with_onnx(&dex_data, Path::new("model.onnx"))?;
/// for (score, pool) in scores {
///     println!("Pool {} scored: {}", pool.dex_name, score);
/// }
/// ```
pub fn score_pools_with_onnx<'a>(
    dex_data: &'a DexData,
    model_path: &Path,
) -> Result<Vec<(f32, &'a Pool)>, Box<dyn Error>> {
    // Setup ONNX session using v2.0.0-rc.10 API
    // Note: commit_from_file is the correct method for this version
    let mut session = Session::builder()?
        .commit_from_file(model_path)?;

    let mut results = Vec::new();

    for pool in &dex_data.pools {
        let features = pool_to_features(pool);
        let input_array = ndarray::Array2::from_shape_vec(
            (1, features.len()),
            features,
        )?;
        
        // Create input tensor value
        let input_tensor = Value::from_array(input_array)?;
        
        // Run inference using ort v2.0.0-rc.10 API
        // The inputs! macro creates the appropriate input format
        let outputs = session.run(ort::inputs![input_tensor])?;
        
        // Extract score from output tensor
        // try_extract_tensor returns (&Shape, &[T]) in this API version
        let (_shape, data) = outputs[0].try_extract_tensor::<f32>()?;
        let score = data.first().copied().unwrap_or(0.0);
        results.push((score, pool));
    }
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_data_loading() {
        // Load test data
        let json = fs::read_to_string("dex_data.json").unwrap();
        let dex_data: DexData = serde_json::from_str(&json).unwrap();
        
        // Verify basic data structure
        assert!(!dex_data.tokens.is_empty());
        assert!(!dex_data.pools.is_empty());
    }
    
    #[test]
    #[ignore] // Ignored because it requires a valid ONNX model file
    fn test_onnx_scoring() {
        // Load test data
        let json = fs::read_to_string("dex_data.json").unwrap();
        let dex_data: DexData = serde_json::from_str(&json).unwrap();
        
        // Use a dummy ONNX model for tests
        let model_path = Path::new("model.onnx");
        if model_path.exists() {
            let result = score_pools_with_onnx(&dex_data, model_path);
            assert!(result.is_ok());
        }
    }
}
