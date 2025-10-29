# Rust AI ONNX Scorer and Dual Engine Executor

This directory contains Rust modules for AI-powered scoring and dual engine execution that integrate with DAT-FECHTER data fetcher output.

## Components

### 1. `dual_executor.rs`
Dual Rust engine executor that reads `dex_data.json` (exported from DAT-FECHTER), parses it, and executes multiple engines (summary and top pool). Extensible for custom scoring/analytics logic.

**Features:**
- Reads JSON data from DAT-FECHTER output
- Trait-based engine system for extensibility
- Two built-in engines: SummaryEngine and TopPoolEngine
- Easy to add custom engines for trading, arbitrage detection, etc.

### 2. `ai_onnx_scorer.rs`
Rust ONNX AI scorer module that loads a model, converts pool data to features, and scores each pool. Uses `ort` and `ndarray` crates.

**Features:**
- ONNX Runtime integration for ML inference
- Converts pool data to feature vectors
- Scores pools using trained ONNX models
- Returns scored results for further processing

### 3. Binary Executable
A command-line tool (`dual_executor`) that demonstrates usage of both modules.

## Installation

### Prerequisites

1. **Rust toolchain** (1.70 or later)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **ONNX Runtime** library

   The `ort` crate requires ONNX Runtime to be installed on your system. You have several options:

   **Option A: Download binaries (recommended for development)**
   Enable the `download-binaries` feature in `Cargo.toml`:
   ```toml
   ort = { version = "2.0.0-rc.10", features = ["ndarray", "std", "download-binaries"] }
   ```

   **Option B: Use system-installed ONNX Runtime**
   ```bash
   # Ubuntu/Debian
   # Download from https://github.com/microsoft/onnxruntime/releases
   # Extract and set environment variables:
   export ORT_LIB_LOCATION=/path/to/onnxruntime/lib
   
   # macOS (via Homebrew)
   # Currently not available via Homebrew - use Option A or manual install
   
   # Windows
   # Download from https://github.com/microsoft/onnxruntime/releases
   # Set ORT_LIB_LOCATION environment variable
   ```

   **Option C: Skip ONNX Runtime (for testing data loading only)**
   ```bash
   # This allows compilation but ONNX scoring won't work
   ORT_SKIP_DOWNLOAD=1 cargo build --lib
   ```

## Building

```bash
# Build library only (useful for integration)
cargo build --lib

# Build with ONNX Runtime support (requires ONNX Runtime installation)
cargo build

# Build the dual_executor binary
cargo build --bin dual_executor
```

## Usage

### As a Library

```rust
use dat_fechter::dual_executor::{DualExecutor, SummaryEngine, TopPoolEngine, DexData};
use dat_fechter::ai_onnx_scorer::score_pools_with_onnx;
use std::path::Path;
use std::fs;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load DAT-FECHTER output
    let json = fs::read_to_string("dex_data.json")?;
    let dex_data: DexData = serde_json::from_str(&json)?;
    
    // Use dual executor
    let mut executor = DualExecutor::new();
    executor.add_engine(Box::new(SummaryEngine));
    executor.add_engine(Box::new(TopPoolEngine));
    executor.run(&dex_data);
    
    // Use ONNX scorer (requires model.onnx)
    if Path::new("model.onnx").exists() {
        let scores = score_pools_with_onnx(&dex_data, Path::new("model.onnx"))?;
        for (score, pool) in scores.iter().take(5) {
            println!("Pool {} scored: {:.4}", pool.dex_name, score);
        }
    }
    
    Ok(())
}
```

### As a Binary

```bash
# Ensure dex_data.json is in the current directory
# Run the dual executor
cargo run --bin dual_executor

# Or run the built binary
./target/debug/dual_executor
```

## Input Format

The `dex_data.json` file should be in the following format (exported from DAT-FECHTER):

```json
{
  "tokens": [
    {
      "symbol": "WETH",
      "decimals": 18,
      "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    }
  ],
  "pools": [
    {
      "dexName": "Uniswap V3",
      "chain": "Ethereum",
      "token0": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "token1": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "reserve0": 1000000000,
      "reserve1": 500000000000000000,
      "fee": 3000
    }
  ]
}
```

## ONNX Model

For the AI scorer to work, you need an ONNX model file named `model.onnx` in the project root. The model should:

- Accept input with shape `[batch_size, 3]` (reserve0, reserve1, fee)
- Output a single score value
- Be compatible with ONNX Runtime 1.22

### Creating a Model

You can train a model in Python using PyTorch or TensorFlow and export it to ONNX format:

```python
import torch
import torch.nn as nn

# Example: Simple scoring model
class PoolScorer(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(3, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU(),
            nn.Linear(8, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        return self.net(x)

# Export to ONNX
model = PoolScorer()
dummy_input = torch.randn(1, 3)
torch.onnx.export(model, dummy_input, "model.onnx", 
                  input_names=['input'], 
                  output_names=['output'])
```

## Testing

```bash
# Run tests
cargo test

# Run with ONNX Runtime skipped (for CI/CD without network access)
ORT_SKIP_DOWNLOAD=1 cargo test --lib
```

## Extending with Custom Engines

Create your own engine by implementing the `Engine` trait:

```rust
use dat_fechter::dual_executor::{Engine, DexData};

struct ArbitrageEngine;

impl Engine for ArbitrageEngine {
    fn execute(&self, data: &DexData) {
        // Your custom logic here
        println!("Analyzing {} pools for arbitrage...", data.pools.len());
        
        // Example: Find price discrepancies
        for pool in &data.pools {
            let price_ratio = pool.reserve1 as f64 / pool.reserve0 as f64;
            println!("Pool {}: ratio = {:.6}", pool.dex_name, price_ratio);
        }
    }
}

// Use it with the executor
let mut executor = DualExecutor::new();
executor.add_engine(Box::new(ArbitrageEngine));
executor.run(&dex_data);
```

## Dependencies

- `serde` - Serialization/deserialization framework
- `serde_json` - JSON support for serde
- `ndarray` - N-dimensional array library for numerical computing
- `ort` - ONNX Runtime bindings for Rust

## Troubleshooting

### Linking Errors with ONNX Runtime

If you see linking errors like `unable to find library -ladd_ort_library_path`, you need to either:

1. Enable the `download-binaries` feature in Cargo.toml
2. Install ONNX Runtime and set `ORT_LIB_LOCATION`
3. Build without ONNX support: `cargo build --lib --no-default-features`

### Network Access Issues

If building in a restricted environment (CI/CD, Docker, etc.):

```bash
# Skip downloading ONNX Runtime
ORT_SKIP_DOWNLOAD=1 cargo build --lib

# Note: This will allow compilation but ONNX scoring won't work at runtime
```

## License

MIT - See LICENSE file in repository root

## Integration with DAT-FECHTER

This Rust module is designed to work with the DAT-FECHTER Node.js data fetcher. To use them together:

1. Run DAT-FECHTER to fetch DEX data:
   ```bash
   npm install
   node -e "const {fetchAllDexData} = require('./src/index'); fetchAllDexData().then(data => require('fs').writeFileSync('dex_data.json', JSON.stringify(data, null, 2)))"
   ```

2. Run the Rust executor:
   ```bash
   cargo run --bin dual_executor
   ```

## Future Enhancements

- WebAssembly compilation for browser usage
- FFI bindings for calling from Node.js
- Additional built-in engines (arbitrage detection, risk scoring)
- Support for streaming data updates
- Distributed execution across multiple nodes
