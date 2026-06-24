package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"codeberg.org/whostyles/whostyles"
)

type MatrixTestCase struct {
	Name  string `json:"name"`
	Input struct {
		Config map[string]float64 `json:"config"`
		Colors map[string]string  `json:"colors"`
	} `json:"input"`
	Hash string `json:"hash"`
}

func main() {
	_, err := os.Getwd()
	if err != nil {
		fmt.Println("Error getting working directory:", err)
		os.Exit(1)
	}
	
	// Assuming verify_go.go is run from the project root or tests folder
	matrixPath := "matrix.json"
	if _, err := os.Stat(matrixPath); os.IsNotExist(err) {
		matrixPath = filepath.Join("tests", "matrix.json")
		if _, err := os.Stat(matrixPath); os.IsNotExist(err) {
			fmt.Println("Error: matrix.json not found")
			os.Exit(1)
		}
	}

	data, err := ioutil.ReadFile(matrixPath)
	if err != nil {
		fmt.Println("Error reading matrix.json:", err)
		os.Exit(1)
	}

	var matrix []MatrixTestCase
	if err := json.Unmarshal(data, &matrix); err != nil {
		fmt.Println("Error parsing matrix.json:", err)
		os.Exit(1)
	}

	failed := 0

	for _, tc := range matrix {
		fmt.Printf("Testing: %s\n", tc.Name)

		// Convert parsed JSON to whostyles structures
		config := make(whostyles.Config)
		for k, v := range tc.Input.Config {
			config[k] = uint64(v)
		}
		colors := make(whostyles.Colors)
		for k, v := range tc.Input.Colors {
			colors[k] = v
		}

		// Test Encoding
		encoded := whostyles.Encode(config, colors)
		if encoded != tc.Hash {
			fmt.Printf("  [FAIL] Encoding mismatch. Expected %s, got %s\n", tc.Hash, encoded)
			failed++
			continue
		}

		// Test Decoding
		decoded, err := whostyles.Decode(tc.Hash)
		if err != nil {
			fmt.Printf("  [FAIL] Decode returned error: %v\n", err)
			failed++
			continue
		}

		// Check config values
		for k, v := range config {
			if decoded.Config[k] != v {
				fmt.Printf("  [FAIL] Config mismatch for %s. Expected %d, got %d\n", k, v, decoded.Config[k])
				failed++
				break
			}
		}

		// Check color values
		for k, v := range colors {
			if decoded.Colors[k] != v {
				fmt.Printf("  [FAIL] Color mismatch for %s. Expected %s, got %s\n", k, v, decoded.Colors[k])
				failed++
				break
			}
		}

		if failed == 0 {
			fmt.Println("  [PASS]")
		}
	}

	fmt.Printf("\nTests completed. %d run, %d failed.\n", len(matrix), failed)
	if failed > 0 {
		os.Exit(1)
	}
}
