use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use whostyles::{decode, encode};

#[derive(Deserialize)]
struct MatrixInput {
    config: HashMap<String, u64>,
    colors: HashMap<String, String>,
}

#[derive(Deserialize)]
struct MatrixTestCase {
    name: String,
    input: MatrixInput,
    hash: String,
    #[serde(default)]
    is_corruption_test: bool,
}

#[test]
fn test_matrix() {
    let mut matrix_path = Path::new("../../tests/matrix.json");
    if !matrix_path.exists() {
        matrix_path = Path::new("../../../tests/matrix.json");
    }

    let data = fs::read_to_string(matrix_path).expect("Unable to read matrix.json");
    let matrix: Vec<MatrixTestCase> = serde_json::from_str(&data).expect("Unable to parse JSON");

    for tc in matrix {
        println!("Testing: {}", tc.name);

        if tc.is_corruption_test {
            let decoded = decode(&tc.hash);
            assert!(decoded.is_err(), "Corruption test decoded successfully, but should have failed for {}", tc.name);
            continue;
        }

        let encoded = encode(&tc.input.config, &tc.input.colors).expect("Encode failed");
        assert_eq!(encoded, tc.hash, "Encoding mismatch for {}", tc.name);

        let decoded = decode(&tc.hash).expect("Decode failed");

        for (k, v) in &tc.input.config {
            assert_eq!(decoded.config.get(k), Some(v), "Config mismatch for {} in {}", k, tc.name);
        }

        for (k, v) in &tc.input.colors {
            assert_eq!(decoded.colors.get(k), Some(v), "Color mismatch for {} in {}", k, tc.name);
        }
    }
}
